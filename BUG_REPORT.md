# Bug Report: Firefox File Transfer Failure

## Summary

File transfers fail in Firefox across all file sizes (small, medium, large). The transfer appears to complete on the sender side, but the receiver's progress bar shows NaN and never reaches 100%, preventing the download button from enabling. The file is received but not properly processed in the UI.

## Environment

- **Browser (Failing)**: Firefox (latest version)
- **Browser (Working)**: Chrome (latest version)
- **OS**: Linux
- **Project**: bc-share (file sharing app using WebRTC)
- **Date**: Wed Sep 24 2025

## Steps to Reproduce

1. Open two browser instances: one in Chrome, one in Firefox.
2. In Chrome: Navigate to the app, click "Send Files", follow instructions, and select a file (e.g., menu.svg, 290 bytes).
3. In Firefox: Navigate to the app, click "Enter Code", enter the code from Chrome, and connect.
4. Initiate the transfer.
5. Observe: Transfer completes in Chrome, but in Firefox, progress shows NaN and download button remains disabled.

## Expected Behavior

- Progress bar updates to 100% in Firefox.
- Download button enables.
- File is downloadable.

## Actual Behavior

- Progress bar shows 0, then NaN.
- No "File received" log.
- Download button stays disabled.
- File is not processed for download.

## Logs

### Verbatim Logs from Successful Transfer (Chrome)

#### Client 1 (Sender)

```
GET https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015 net::ERR_BLOCKED_BY_CLIENT
(index):10  GET https://share.bestcodes.dev/cdn-cgi/zaraz/s.js?z=JTdCJTIyZXhlY3V0ZWQlMjIlM0ElNUIlNUQlMkMlMjJ0JTIyJTNBJTIyQkNTaGFyZSUyMC0lMjBGYXN0JTIwZnJlZSUyMGFuZCUyMHVubGltaXRlZCUyMGZpbGUlMjBzaGFyaW5nJTIyJTJDJTIyeCUyMiUzQTAuNjM5MDczODkxNjU0NTY4NiUyQyUyMnclMjIlM0ExOTIwJTJDJTIyaCUyMiUzQTEwODAlMkMlMjJqJTIyJTNBOTk1JTJDJTIyZSUyMiUzQTEzMTAlMkMlMjJsJTIyJTNBJTIyaHR0cHMlM0ElMkYlMkZzaGFyZS5iZXN0Y29kZXMuZGV2JTJGJTIyJTJDJTIyciUyMiUzQSUyMiUyMiUyQyUyMmslMjIlM0EyNCUyQyUyMm4lMjIlM0ElMjJVVEYtOCUyMiUyQyUyMm8lMjIlM0EzMDAlMkMlMjJxJTIyJTNBJTVCJTVEJTdE net::ERR_BLOCKED_BY_CLIENT
j.zaraz.init @ (index):10
dev_enableVerboseLogging()
index-D-ufxa7h.js:177 SUPER VERBOSE LOGGING ENABLED: All logs will now be extremely detailed
undefined
index-D-ufxa7h.js:165 HomePage.tsx: User clicked "Send Files", navigating to /instructions?go=send
index-D-ufxa7h.js:165 InstructionsPage.tsx: InstructionsPage rendered with action: send
index-D-ufxa7h.js:165 InstructionsPage.tsx: User clicked Continue, navigating to /send
index-D-ufxa7h.js:177 SendPage.tsx: SendPage component initialized with initial state
index-D-ufxa7h.js:177 SendPage.tsx: useEffect initializing SocketService
index-D-ufxa7h.js:170 SocketService: Initializing SocketService
index-D-ufxa7h.js:170 SocketService: Connecting to socket server
index-D-ufxa7h.js:170 SocketService: Connected to socket server
index-D-ufxa7h.js:170 SocketService: Received client ID: lsjvof
index-D-ufxa7h.js:177 SendPage.tsx: Received client ID: lsjvof
index-D-ufxa7h.js:177 SendPage.tsx: SendPage component initialized with initial state
index-D-ufxa7h.js:170 SocketService: Received pong from server
index-D-ufxa7h.js:170 SocketService: Joining room: vaa60p as initiator: true
index-D-ufxa7h.js:177 SendPage.tsx: Connection status updated: {isConnected: false, clientId: 'lsjvof', isInitiator: true, room: 'vaa60p'}
index-D-ufxa7h.js:177 SendPage.tsx: SendPage component initialized with initial state
index-D-ufxa7h.js:170 SocketService: Socket ready
index-D-ufxa7h.js:170 Socket ready
index-D-ufxa7h.js:170 SocketService: Socket ready
index-D-ufxa7h.js:170 Socket ready
index-D-ufxa7h.js:170 SocketService: Received signaling message: {type: 'answer', sdp: 'v=0\r\no=- 2725298824571103449 2 IN IP4 127.0.0.1\r\ns…:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n'}
index-D-ufxa7h.js:170 SocketService: Received signaling message: {type: 'candidate', label: 0, id: '0', candidate: 'candidate:232073548 1 udp 2113937151 7d1a42ad-4dd2…typ host generation 0 ufrag da0Q network-cost 999'}
index-D-ufxa7h.js:170 Data channel opened
index-D-ufxa7h.js:177 SendPage.tsx: Connection status updated: {isConnected: true, clientId: 'lsjvof', isInitiator: true, room: 'vaa60p'}
index-D-ufxa7h.js:177 SendPage.tsx: SendPage component initialized with initial state
index-D-ufxa7h.js:177 SendPage.tsx: User clicked browse files
index-D-ufxa7h.js:177 SendPage.tsx: User clicked browse files
index-D-ufxa7h.js:177 SendPage.tsx: Adding files to send: ['menu.svg']
index-D-ufxa7h.js:177 SendPage.tsx: Sending files via SocketService
index-D-ufxa7h.js:170 SocketService: Sending files: ['menu.svg']
index-D-ufxa7h.js:170 SocketService: Sending single file: menu.svg size: 290
index-D-ufxa7h.js:170 SocketService: Sending file metadata: {name: 'menu.svg', size: 290}
index-D-ufxa7h.js:177 SendPage.tsx: SendPage component initialized with initial state
index-D-ufxa7h.js:170 formatFileSize: Formatting bytes: 290
index-D-ufxa7h.js:177 SendPage.tsx: Transfer progress updated: {fileIndex: 0, fileName: 'menu.svg', progress: 100, transferRate: 19333.333333333336, eta: 0, …}
index-D-ufxa7h.js:177 SendPage.tsx: Transfer progress updated: {fileIndex: 0, fileName: 'menu.svg', progress: 100, transferRate: 16111.111111111113, eta: 0, …}
index-D-ufxa7h.js:177 SendPage.tsx: SendPage component initialized with initial state
index-D-ufxa7h.js:170 SocketService: Received pong from server
index-D-ufxa7h.js:177 SendPage.tsx: SendPage component initialized with initial state
index-D-ufxa7h.js:170 Ping received from peer
index-D-ufxa7h.js:170 SocketService: Received pong from server
index-D-ufxa7h.js:170 Ping received from peer
```

#### Client 2 (Receiver)

```
dev_enableVerboseLogging()
index-D-ufxa7h.js:177 SUPER VERBOSE LOGGING ENABLED: All logs will now be extremely detailed
undefined
index-D-ufxa7h.js:165 HomePage.tsx: User clicked "Enter Code", navigating to /instructions?go=enter-code
index-D-ufxa7h.js:165 InstructionsPage.tsx: InstructionsPage rendered with action: enter-code
index-D-ufxa7h.js:165 InstructionsPage.tsx: User clicked Continue, navigating to /enter-code
index-D-ufxa7h.js:165 EnterCodePage.tsx: EnterCodePage component rendered
index-D-ufxa7h.js:165 EnterCodePage.tsx: EnterCodePage component rendered
index-D-ufxa7h.js:165 EnterCodePage.tsx: User clicked Continue with clientId: lsjvof
index-D-ufxa7h.js:165 EnterCodePage.tsx: EnterCodePage component rendered
index-D-ufxa7h.js:170 ReceivePage.tsx: ReceivePage component initialized, clientId from URL: lsjvof
index-D-ufxa7h.js:170 ReceivePage.tsx: useEffect triggered, clientIdFromUrl: lsjvof
index-D-ufxa7h.js:170 ReceivePage.tsx: Connecting to sender with clientId: lsjvof
index-D-ufxa7h.js:170 SocketService: Initializing SocketService
index-D-ufxa7h.js:170 SocketService: Connecting to socket server
index-D-ufxa7h.js:170 SocketService: Connected to socket server
index-D-ufxa7h.js:170 SocketService: Received client ID: y3xter
index-D-ufxa7h.js:170 ReceivePage.tsx: Attempting to connect to client
index-D-ufxa7h.js:170 SocketService: Connecting to client: lsjvof
index-D-ufxa7h.js:170 SocketService: Joining room: vaa60p as initiator: false
index-D-ufxa7h.js:170 ReceivePage.tsx: Connection status updated: {isConnected: false, clientId: 'y3xter', isInitiator: false, room: 'vaa60p'}
index-D-ufxa7h.js:170 ReceivePage.tsx: ReceivePage component initialized, clientId from URL: lsjvof
index-D-ufxa7h.js:170 SocketService: Socket ready
index-D-ufxa7h.js:170 Socket ready
index-D-ufxa7h.js:170 SocketService: Socket ready
index-D-ufxa7h.js:170 Socket ready
index-D-ufxa7h.js:170 SocketService: Received signaling message: {type: 'offer', sdp: 'v=0\r\no=- 452197314739575238 2 IN IP4 127.0.0.1\r\ns=…:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n'}
index-D-ufxa7h.js:170 SocketService: Received signaling message: {type: 'candidate', label: 0, id: '0', candidate: 'candidate:491284321 1 udp 2113937151 7660c5fa-311c…typ host generation 0 ufrag Zqse network-cost 999'}
index-D-ufxa7h.js:170 SocketService: Received signaling message: {type: 'candidate', label: 0, id: '0', candidate: 'candidate:4060945807 1 udp 1677729535 64.226.41.38… rport 0 generation 0 ufrag Zqse network-cost 999'}
index-D-ufxa7h.js:170 Data channel opened
index-D-ufxa7h.js:170 ReceivePage.tsx: Connection status updated: {isConnected: true, clientId: 'y3xter', isInitiator: false, room: 'vaa60p'}
index-D-ufxa7h.js:170 ReceivePage.tsx: ReceivePage component initialized, clientId from URL: lsjvof
index-D-ufxa7h.js:170 ReceivePage.tsx: Received metadata: {name: 'menu.svg', size: 290}
index-D-ufxa7h.js:170 ReceivePage.tsx: Transfer progress: {fileIndex: 0, fileName: 'menu.svg', progress: 0, transferRate: 0, eta: 0, …}
index-D-ufxa7h.js:170 ReceivePage.tsx: ReceivePage component initialized, clientId from URL: lsjvof
index-D-ufxa7h.js:170 formatFileSize: Formatting bytes: 290
index-D-ufxa7h.js:170 ReceivePage.tsx: Transfer progress: {fileIndex: 0, fileName: 'menu.svg', progress: 100, transferRate: 58000, eta: 0, …}
index-D-ufxa7h.js:170 ReceivePage.tsx: File received: menu.svg
index-D-ufxa7h.js:170 ReceivePage.tsx: Transfer progress: {fileIndex: 0, fileName: 'menu.svg', progress: 100, transferRate: 58000, eta: 0, …}
index-D-ufxa7h.js:170 ReceivePage.tsx: ReceivePage component initialized, clientId from URL: lsjvof
index-D-ufxa7h.js:170 formatFileSize: Formatting bytes: 290
index-D-ufxa7h.js:170 SocketService: Received pong from server
index-D-ufxa7h.js:170 Ping received from peer
```

### Verbatim Logs from Failed Transfer (Firefox)

#### Client 1 (Sender)

```
dev_enableVerboseLogging()
SUPER VERBOSE LOGGING ENABLED: All logs will now be extremely detailed index-D-ufxa7h.js:177:11666
undefined
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://stats.g.doubleclick.net/g/collect?t=dc&aip=1&_r=3&v=1&_v=j86&tid=G-0KLZV1DQKW&cid=8db6ea40-69e8-4e72-ba02-8f77022f1892&_u=KGDAAEADQAAAAC%7E&z=133576865. (Reason: CORS request did not succeed). Status code: (null).

HomePage.tsx: User clicked "Send Files", navigating to /instructions?go=send index-D-ufxa7h.js:165:54670
InstructionsPage.tsx: InstructionsPage rendered with action: send index-D-ufxa7h.js:165:55319
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://stats.g.doubleclick.net/g/collect?t=dc&aip=1&_r=3&v=1&_v=j86&tid=G-0KLZV1DQKW&cid=8db6ea40-69e8-4e72-ba02-8f77022f1892&_u=KGDAAEADQAAAAC%7E&z=718203035. (Reason: CORS request did not succeed). Status code: (null).

InstructionsPage.tsx: User clicked Continue, navigating to /send index-D-ufxa7h.js:165:55630
SendPage.tsx: SendPage component initialized with initial state index-D-ufxa7h.js:177:960
SendPage.tsx: useEffect initializing SocketService index-D-ufxa7h.js:177:1350
SocketService: Initializing SocketService index-D-ufxa7h.js:170:42306
SocketService: Connecting to socket server index-D-ufxa7h.js:170:42414
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://stats.g.doubleclick.net/g/collect?t=dc&aip=1&_r=3&v=1&_v=j86&tid=G-0KLZV1DQKW&cid=8db6ea40-69e8-4e72-ba02-8f77022f1892&_u=KGDAAEADQAAAAC%7E&z=1333199766. (Reason: CORS request did not succeed). Status code: (null).

SocketService: Connected to socket server index-D-ufxa7h.js:170:42584
SocketService: Received client ID: yae94f index-D-ufxa7h.js:170:42722
SendPage.tsx: Received client ID: yae94f index-D-ufxa7h.js:177:1493
SendPage.tsx: SendPage component initialized with initial state index-D-ufxa7h.js:177:960
SocketService: Received pong from server index-D-ufxa7h.js:170:42874
SocketService: Joining room: gpdxzu as initiator: true index-D-ufxa7h.js:170:42988
SendPage.tsx: Connection status updated:
Object { isConnected: false, clientId: "yae94f", isInitiator: true, room: "gpdxzu" }
index-D-ufxa7h.js:177:1613
SendPage.tsx: SendPage component initialized with initial state index-D-ufxa7h.js:177:960
SocketService: Socket ready index-D-ufxa7h.js:170:43642
Socket ready index-D-ufxa7h.js:170:43685
SocketService: Socket ready index-D-ufxa7h.js:170:43642
Socket ready index-D-ufxa7h.js:170:43685
SocketService: Received signaling message:
Object { type: "answer", sdp: "v=0\r\no=mozilla...THIS_IS_SDPARTA-99.0 4392469686462061977 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=sendrecv\r\na=fingerprint:sha-256 86:E9:01:9A:46:6E:80:96:55:E7:E2:6E:4A:18:D0:6F:50:B7:BF:A7:B9:5A:F0:94:EE:1D:64:1E:32:99:88:B2\r\na=group:BUNDLE 0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=extmap-allow-mixed\r\na=ice-pwd:c9bfac6a0f3ed3e2550e30b5b48c2d6f\r\na=ice-ufrag:ddcc4611\r\na=mid:0\r\na=setup:active\r\na=sctp-port:5000\r\na=max-message-size:1073741823\r\n" }
index-D-ufxa7h.js:170:43770
SocketService: Received signaling message:
Object { type: "candidate", label: 0, id: "0", candidate: "candidate:0 1 UDP 2122252543 a2d23828-ed4d-4d30-8685-a11a6505fcc2.local 57627 typ host" }
index-D-ufxa7h.js:170:43770
SocketService: Received signaling message:
Object { type: "candidate", label: 0, id: "0", candidate: "candidate:2 1 TCP 2105524479 a2d23828-ed4d-4d30-8685-a11a6505fcc2.local 9 typ host tcptype active" }
index-D-ufxa7h.js:170:43770
SocketService: Received signaling message:
Object { type: "candidate", label: 0, id: "0", candidate: "candidate:1 1 UDP 1686052863 64.226.41.38 57627 typ srflx raddr 0.0.0.0 rport 0" }
index-D-ufxa7h.js:170:43770
SocketService: Received signaling message:
Object { type: "candidate", label: 0, id: "0", candidate: "" }
index-D-ufxa7h.js:170:43770
Data channel opened index-D-ufxa7h.js:170:45433
SendPage.tsx: Connection status updated:
Object { isConnected: true, clientId: "yae94f", isInitiator: true, room: "gpdxzu" }
index-D-ufxa7h.js:177:1613
SendPage.tsx: SendPage component initialized with initial state index-D-ufxa7h.js:177:960
SendPage.tsx: User clicked browse files 2 index-D-ufxa7h.js:177:3689
SendPage.tsx: Adding files to send:
Array [ "menu.svg" ]
index-D-ufxa7h.js:177:3132
SendPage.tsx: Sending files via SocketService index-D-ufxa7h.js:177:3451
SocketService: Sending files:
Array [ "menu.svg" ]
index-D-ufxa7h.js:170:48533
SocketService: Sending single file: menu.svg size: 290 index-D-ufxa7h.js:170:48859
SocketService: Sending file metadata:
Object { name: "menu.svg", size: 290 }
index-D-ufxa7h.js:170:49083
SendPage.tsx: SendPage component initialized with initial state index-D-ufxa7h.js:177:960
formatFileSize: Formatting bytes: 290 index-D-ufxa7h.js:170:51634
SendPage.tsx: Transfer progress updated:
Object { fileIndex: 0, fileName: "menu.svg", progress: 100, transferRate: 48333.333333333336, eta: 0, status: "transferring" }
index-D-ufxa7h.js:177:1757
SendPage.tsx: Transfer progress updated:
Object { fileIndex: 0, fileName: "menu.svg", progress: 100, transferRate: 48333.333333333336, eta: 0, status: "completed" }
index-D-ufxa7h.js:177:1757
SendPage.tsx: SendPage component initialized with initial state 2 index-D-ufxa7h.js:177:960
SocketService: Received pong from server index-D-ufxa7h.js:170:42874
Ping received from peer
```

#### Client 2 (Receiver)

```
dev_enableVerboseLogging()
SUPER VERBOSE LOGGING ENABLED: All logs will now be extremely detailed index-D-ufxa7h.js:177:11666
undefined
HomePage.tsx: User clicked "Enter Code", navigating to /instructions?go=enter-code index-D-ufxa7h.js:165:55023
InstructionsPage.tsx: InstructionsPage rendered with action: enter-code index-D-ufxa7h.js:165:55319
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://stats.g.doubleclick.net/g/collect?t=dc&aip=1&_r=3&v=1&_v=j86&tid=G-0KLZV1DQKW&cid=8db6ea40-69e8-4e72-ba02-8f77022f1892&_u=KGDAAEADQAAAAC%7E&z=1597598085. (Reason: CORS request did not succeed). Status code: (null).

InstructionsPage.tsx: User clicked Continue, navigating to /enter-code index-D-ufxa7h.js:165:55630
EnterCodePage.tsx: EnterCodePage component rendered index-D-ufxa7h.js:165:52284
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://stats.g.doubleclick.net/g/collect?t=dc&aip=1&_r=3&v=1&_v=j86&tid=G-0KLZV1DQKW&cid=8db6ea40-69e8-4e72-ba02-8f77022f1892&_u=KGDAAEADQAAAAC%7E&z=1835078416. (Reason: CORS request did not succeed). Status code: (null).

EnterCodePage.tsx: EnterCodePage component rendered index-D-ufxa7h.js:165:52284
EnterCodePage.tsx: User clicked Continue with clientId: yae94f index-D-ufxa7h.js:165:52695
EnterCodePage.tsx: EnterCodePage component rendered index-D-ufxa7h.js:165:52284
ReceivePage.tsx: ReceivePage component initialized, clientId from URL: yae94f index-D-ufxa7h.js:170:52364
ReceivePage.tsx: useEffect triggered, clientIdFromUrl: yae94f index-D-ufxa7h.js:170:52618
ReceivePage.tsx: Connecting to sender with clientId: yae94f index-D-ufxa7h.js:170:52868
SocketService: Initializing SocketService index-D-ufxa7h.js:170:42306
SocketService: Connecting to socket server index-D-ufxa7h.js:170:42414
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://stats.g.doubleclick.net/g/collect?t=dc&aip=1&_r=3&v=1&_v=j86&tid=G-0KLZV1DQKW&cid=8db6ea40-69e8-4e72-ba02-8f77022f1892&_u=KGDAAEADQAAAAC%7E&z=1448552640. (Reason: CORS request did not succeed). Status code: (null).

SocketService: Connected to socket server index-D-ufxa7h.js:170:42584
SocketService: Received client ID: l6uzfp index-D-ufxa7h.js:170:42722
ReceivePage.tsx: Attempting to connect to client index-D-ufxa7h.js:170:54272
SocketService: Connecting to client: yae94f index-D-ufxa7h.js:170:48385
SocketService: Joining room: gpdxzu as initiator: false index-D-ufxa7h.js:170:42988
ReceivePage.tsx: Connection status updated:
Object { isConnected: false, clientId: "l6uzfp", isInitiator: false, room: "gpdxzu" }
index-D-ufxa7h.js:170:53082
ReceivePage.tsx: ReceivePage component initialized, clientId from URL: yae94f index-D-ufxa7h.js:170:52364
SocketService: Socket ready index-D-ufxa7h.js:170:43642
Socket ready index-D-ufxa7h.js:170:43685
SocketService: Socket ready index-D-ufxa7h.js:170:43642
Socket ready index-D-ufxa7h.js:170:43685
SocketService: Received signaling message:
Object { type: "offer", sdp: "v=0\r\no=mozilla...THIS_IS_SDPARTA-99.0 3527136285291574017 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=sendrecv\r\na=fingerprint:sha-256 B4:74:72:0A:E9:F6:FF:8E:9C:E0:93:ED:36:28:91:8A:58:56:CC:2A:20:10:27:43:2E:0B:29:5B:D8:D1:AF:EE\r\na=group:BUNDLE 0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=extmap-allow-mixed\r\na=ice-pwd:d6bad09d1f1e7693cbceb6c3b39267fb\r\na=ice-ufrag:3334ef72\r\na=mid:0\r\na=setup:actpass\r\na=sctp-port:5000\r\na=max-message-size:1073741823\r\n" }
index-D-ufxa7h.js:170:43770
SocketService: Received signaling message:
Object { type: "candidate", label: 0, id: "0", candidate: "candidate:0 1 UDP 2122252543 d71d629e-b920-481e-952b-3f0328318a75.local 51102 typ host" }
index-D-ufxa7h.js:170:43770
SocketService: Received signaling message:
Object { type: "candidate", label: 0, id: "0", candidate: "candidate:2 1 TCP 2105524479 d71d629e-b920-481e-952b-3f0328318a75.local 9 typ host tcptype active" }
index-D-ufxa7h.js:170:43770
SocketService: Received signaling message:
Object { type: "candidate", label: 0, id: "0", candidate: "candidate:1 1 UDP 1686052863 64.226.41.38 51102 typ srflx raddr 0.0.0.0 rport 0" }
index-D-ufxa7h.js:170:43770
SocketService: Received signaling message:
Object { type: "candidate", label: 0, id: "0", candidate: "" }
index-D-ufxa7h.js:170:43770
Data channel opened index-D-ufxa7h.js:170:45433
ReceivePage.tsx: Connection status updated:
Object { isConnected: true, clientId: "l6uzfp", isInitiator: false, room: "gpdxzu" }
index-D-ufxa7h.js:170:53082
ReceivePage.tsx: ReceivePage component initialized, clientId from URL: yae94f index-D-ufxa7h.js:170:52364
ReceivePage.tsx: Received metadata:
Object { name: "menu.svg", size: 290 }
index-D-ufxa7h.js:170:53236
ReceivePage.tsx: Transfer progress:
Object { fileIndex: 0, fileName: "menu.svg", progress: 0, transferRate: 0, eta: 0, status: "transferring" }
index-D-ufxa7h.js:170:53866
ReceivePage.tsx: ReceivePage component initialized, clientId from URL: yae94f index-D-ufxa7h.js:170:52364
formatFileSize: Formatting bytes: 290 index-D-ufxa7h.js:170:51634
ReceivePage.tsx: Transfer progress:
Object { fileIndex: 0, fileName: "menu.svg", progress: NaN, transferRate: NaN, eta: 0, status: "transferring" }
index-D-ufxa7h.js:170:53866
ReceivePage.tsx: ReceivePage component initialized, clientId from URL: yae94f index-D-ufxa7h.js:170:52364
formatFileSize: Formatting bytes: 290 index-D-ufxa7h.js:170:51634
SocketService: Received pong from server index-D-ufxa7h.js:170:42874
Ping received from peer index-D-ufxa7h.js:170:46949
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://stats.g.doubleclick.net/g/collect?t=dc&aip=1&_r=3&v=1&_v=j86&tid=G-0KLZV1DQKW&cid=8db6ea40-69e8-4e72-ba02-8f77022f1892&_u=KGDAAEADQAAAAC%7E&z=1778274970. (Reason: CORS request did not succeed). Status code: (null).

SocketService: Received pong from server index-D-ufxa7h.js:170:42874
Ping received from peer
```

### Cleaned Up Logs (Key Differences)

#### Successful Transfer (Chrome)

- Sender: Progress updates to 100%, status "completed".
- Receiver: Metadata received, progress to 100%, "File received: menu.svg".

#### Failed Transfer (Firefox)

- Sender: Progress to 100%, status "completed".
- Receiver: Metadata received, progress to 0 then NaN, no "File received".

## Additional Notes

- CORS errors are from ad blockers and can be ignored.
- No errors thrown in either browser.
- Issue occurs for all file sizes, not just small ones.
- Suggest testing in other browsers or with different WebRTC configurations.
