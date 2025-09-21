const socket = io();

const clientIdDiv = document.getElementById('clientId');
const targetIdInput = document.getElementById('targetIdInput');
const connectBtn = document.getElementById('connectBtn');
const fileInput = document.getElementById('fileInput');
const sendBtn = document.getElementById('sendBtn');
const statusMessages = document.getElementById('status-messages');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const downloadLinkContainer = document.getElementById('download-link-container');

let peerConnection;
let dataChannel;
let file;
let receivedSize = 0;
let receiveBuffer = [];
let fileMetadata = {};
let room;

const CHUNK_SIZE = 64 * 1024; // 64KB

// --- Signaling --- //

socket.on('clientId', (id) => {
    clientIdDiv.innerText = id;
});

let isInitiator = false;

socket.on('join', (roomName, isInitiatorFlag) => {
    room = roomName;
    isInitiator = isInitiatorFlag;
    console.log(`Joining room ${room} as ${isInitiator ? 'initiator' : 'receiver'}`);
    socket.emit('join', room);
    createPeerConnection();
    if (isInitiator) {
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                sendMessage(peerConnection.localDescription, room);
            })
            .catch(e => console.error(e));
    }
});

socket.on('ready', () => {
    console.log('Ready');
});

socket.on('message', (message) => {
    console.log('Client received message:', message);
    if (message.type === 'offer') {
        if (!peerConnection) {
            createPeerConnection();
        }
        peerConnection.setRemoteDescription(new RTCSessionDescription(message));
        peerConnection.createAnswer()
            .then(answer => peerConnection.setLocalDescription(answer))
            .then(() => {
                sendMessage(peerConnection.localDescription, room);
            })
            .catch(e => console.error(e));
    } else if (message.type === 'answer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate') {
        const candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });
        peerConnection.addIceCandidate(candidate);
    }
});

function sendMessage(message, room) {
    console.log('Client sending message: ', message);
    socket.emit('message', message, room);
}

// --- WebRTC --- //

function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(null);
        peerConnection.onicecandidate = handleICECandidate;
        peerConnection.ondatachannel = handleDataChannel;
        if (isInitiator) {
            console.log('Creating data channel');
            dataChannel = peerConnection.createDataChannel('file');
            dataChannel.onopen = () => console.log('Data channel is open');
            dataChannel.onmessage = handleMessage;
        }
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

function handleICECandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        }, room);
    }
}

function handleDataChannel(event) {
    console.log('handleDataChannel', event);
    dataChannel = event.channel;
    dataChannel.onmessage = handleMessage;
}

function sendData() {
    console.log('Sending data');
    file = fileInput.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }

    console.log('Sending file:', file.name);
    statusMessages.innerText = 'Sending file...';
    progressContainer.style.display = 'block';

    // Send file metadata first
    dataChannel.send(JSON.stringify({ name: file.name, size: file.size }));

    const fileReader = new FileReader();
    let offset = 0;

    fileReader.onload = ({ target }) => {
        if (target.error) {
            console.error(`File could not be read! Error: ${target.error}`);
            return;
        }
        dataChannel.send(target.result);
        offset += target.result.byteLength;
        progressBar.style.width = `${Math.round((offset / file.size) * 100)}%`;
        progressBar.innerText = `${Math.round((offset / file.size) * 100)}%`;

        if (offset < file.size) {
            readSlice(offset);
        }
    };

    const readSlice = o => {
        const slice = file.slice(o, o + CHUNK_SIZE);
        fileReader.readAsArrayBuffer(slice);
    };
    readSlice(0);
}

function handleMessage(event) {
    if (typeof event.data === 'string') {
        fileMetadata = JSON.parse(event.data);
        console.log('Received file metadata:', fileMetadata);
        statusMessages.innerText = 'Receiving file...';
        progressContainer.style.display = 'block';
        return;
    }

    receiveBuffer.push(event.data);
    receivedSize += event.data.byteLength;

    progressBar.style.width = `${Math.round((receivedSize / fileMetadata.size) * 100)}%`;
    progressBar.innerText = `${Math.round((receivedSize / fileMetadata.size) * 100)}%`;

    if (receivedSize === fileMetadata.size) {
        const received = new Blob(receiveBuffer);
        receiveBuffer = [];

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(received);
        downloadLink.download = fileMetadata.name;
        downloadLink.textContent = `Click to download '${fileMetadata.name}'`;
        downloadLinkContainer.appendChild(downloadLink);

        statusMessages.innerText = 'File received successfully!';
    }
}

// --- UI Events --- //

connectBtn.addEventListener('click', () => {
    const targetId = targetIdInput.value;
    if (targetId === '') {
        alert('Please enter a client ID');
        return;
    }
    socket.emit('connect to', targetId);
});

sendBtn.addEventListener('click', () => {
    sendData();
});
