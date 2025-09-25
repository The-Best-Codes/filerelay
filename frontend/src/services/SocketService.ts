import { io, Socket } from "socket.io-client";

export interface FileMetadata {
  name: string;
  size: number;
}

export interface FileTransferProgress {
  fileIndex: number;
  fileName: string;
  progress: number;
  transferRate: number;
  eta: number;
  status: "waiting" | "transferring" | "completed" | "error";
}

export interface ConnectionStatus {
  isConnected: boolean;
  clientId?: string;
  isInitiator?: boolean;
  room?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private room: string | null = null;
  private isInitiator: boolean = false;
  private clientId: string | null = null;

  // Ping/Pong intervals
  private serverPingInterval: ReturnType<typeof setInterval> | null = null;
  private peerPingInterval: ReturnType<typeof setInterval> | null = null;

  // Callbacks
  private onClientIdCallback?: (clientId: string) => void;
  private onConnectionStatusCallback?: (status: ConnectionStatus) => void;
  private onFileReceiveCallback?: (file: Blob, metadata: FileMetadata) => void;
  private onTransferProgressCallback?: (progress: FileTransferProgress) => void;
  private onMetadataReceiveCallback?: (metadata: FileMetadata) => void;
  private onErrorCallback?: (error: string) => void;

  // File transfer state
  private receivedBuffer: ArrayBuffer[] = [];
  private receivedSize: number = 0;
  private fileMetadata: FileMetadata | null = null;
  private transferStartTime: number = 0;

  private readonly CHUNK_SIZE = 32 * 1024; // 32KB

  constructor() {
    if (window.devVerboseLogging)
      console.log("SocketService: Initializing SocketService");
    this.connect();
  }

  private connect() {
    if (window.devVerboseLogging)
      console.log("SocketService: Connecting to socket server");
    // Use current host or fallback to localhost
    const baseUrl =
      import.meta.env.VITE_BASE_URL ||
      `${window.location.protocol}//${window.location.hostname}:1869`;

    this.socket = io(baseUrl);

    this.socket.on("connect", () => {
      if (window.devVerboseLogging)
        console.log("SocketService: Connected to socket server");
      this.startServerPing();
    });

    this.socket.on("clientId", (id: string) => {
      if (window.devVerboseLogging)
        console.log("SocketService: Received client ID:", id);
      this.clientId = id;
      this.onClientIdCallback?.(id);
    });

    this.socket.on("pong", () => {
      if (window.devVerboseLogging)
        console.log("SocketService: Received pong from server");
      // Pong from server received
    });

    this.socket.on("join", (roomName: string, isInitiatorFlag: boolean) => {
      if (window.devVerboseLogging)
        console.log(
          "SocketService: Joining room:",
          roomName,
          "as initiator:",
          isInitiatorFlag,
        );
      this.room = roomName;
      this.isInitiator = isInitiatorFlag;
      this.socket?.emit("join", roomName);
      this.createPeerConnection();

      if (this.isInitiator) {
        this.peerConnection
          ?.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false,
          })
          .then((offer) => this.peerConnection?.setLocalDescription(offer))
          .then(() => {
            this.sendMessage(this.peerConnection?.localDescription, roomName);
          })
          .catch((e) => {
            console.error("Error creating offer:", e);
            this.onErrorCallback?.("Failed to create connection offer");
          });
      }

      this.onConnectionStatusCallback?.({
        isConnected: false,
        clientId: this.clientId!,
        isInitiator: this.isInitiator,
        room: roomName,
      });
    });

    this.socket.on("ready", () => {
      if (window.devVerboseLogging) console.log("SocketService: Socket ready");
      console.log("Socket ready");
    });

    this.socket.on("message", (message: unknown) => {
      if (window.devVerboseLogging)
        console.log("SocketService: Received signaling message:", message);
      this.handleSignalingMessage(message);
    });

    this.socket.on("disconnect", () => {
      if (window.devVerboseLogging)
        console.log("SocketService: Disconnected from socket server");
      this.stopServerPing();
      this.onConnectionStatusCallback?.({
        isConnected: false,
        clientId: this.clientId!,
      });
    });
  }

  private startServerPing() {
    this.stopServerPing();
    this.serverPingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit("ping");
      }
    }, 10000);
  }

  private stopServerPing() {
    if (this.serverPingInterval) {
      clearInterval(this.serverPingInterval);
      this.serverPingInterval = null;
    }
  }

  private startPeerPing() {
    this.stopPeerPing();
    this.peerPingInterval = setInterval(() => {
      if (this.dataChannel && this.dataChannel.readyState === "open") {
        this.dataChannel.send(JSON.stringify({ type: "ping" }));
      }
    }, 10000);
  }

  private stopPeerPing() {
    if (this.peerPingInterval) {
      clearInterval(this.peerPingInterval);
      this.peerPingInterval = null;
    }
  }

  private createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      });

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.room) {
          this.sendMessage(
            {
              type: "candidate",
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              candidate: event.candidate.candidate,
            },
            this.room,
          );
        }
      };

      this.peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel);
      };

      if (this.isInitiator) {
        this.dataChannel = this.peerConnection.createDataChannel("file", {
          ordered: true,
        });
        this.setupDataChannel(this.dataChannel);
      }
    } catch (error) {
      console.error("Failed to create peer connection:", error);
      this.onErrorCallback?.("Failed to create peer connection");
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;

    this.dataChannel.onopen = () => {
      console.log("Data channel opened");
      this.onConnectionStatusCallback?.({
        isConnected: true,
        clientId: this.clientId!,
        isInitiator: this.isInitiator,
        room: this.room!,
      });
      this.startPeerPing();
    };

    this.dataChannel.onclose = () => {
      console.log("Data channel closed");
      this.onConnectionStatusCallback?.({
        isConnected: false,
        clientId: this.clientId!,
      });
      this.stopPeerPing();
    };

    this.dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(event);
    };

    this.dataChannel.onerror = (error) => {
      console.error("Data channel error:", error);
      this.onErrorCallback?.("Data channel error occurred");
    };
  }

  private handleSignalingMessage(message: unknown) {
    const msg = message as {
      type: string;
      sdpMLineIndex?: number;
      candidate?: string;
      label?: number;
    };
    if (msg.type === "offer") {
      if (!this.peerConnection) {
        this.createPeerConnection();
      }
      this.peerConnection
        ?.setRemoteDescription(
          new RTCSessionDescription(msg as RTCSessionDescriptionInit),
        )
        .then(() => this.peerConnection?.createAnswer())
        .then((answer) => this.peerConnection?.setLocalDescription(answer))
        .then(() => {
          this.sendMessage(this.peerConnection?.localDescription, this.room!);
        })
        .catch((e) => {
          console.error("Error handling offer:", e);
          this.onErrorCallback?.("Failed to handle connection offer");
        });
    } else if (msg.type === "answer") {
      this.peerConnection
        ?.setRemoteDescription(
          new RTCSessionDescription(msg as RTCSessionDescriptionInit),
        )
        .catch((e) => {
          console.error("Error handling answer:", e);
          this.onErrorCallback?.("Failed to handle connection answer");
        });
    } else if (msg.type === "candidate") {
      const candidate = new RTCIceCandidate({
        sdpMLineIndex: msg.label,
        candidate: msg.candidate,
      });
      this.peerConnection?.addIceCandidate(candidate).catch((e) => {
        console.error("Error adding ICE candidate:", e);
      });
    }
  }

  private handleDataChannelMessage(event: MessageEvent) {
    if (typeof event.data === "string") {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "ping") {
          console.log("Ping received from peer");
          if (this.dataChannel && this.dataChannel.readyState === "open") {
            this.dataChannel.send(JSON.stringify({ type: "pong" }));
          }
          return;
        }
        if (message.type === "pong") {
          // Pong received from peer. Can be used for latency/liveness check.
          return;
        }

        // File metadata
        this.fileMetadata = message;
        this.receivedSize = 0;
        this.receivedBuffer = [];
        this.transferStartTime = Date.now();

        // Notify about metadata
        if (this.fileMetadata) {
          this.onMetadataReceiveCallback?.(this.fileMetadata);
        }

        this.onTransferProgressCallback?.({
          fileIndex: 0,
          fileName: this.fileMetadata?.name || "Unknown",
          progress: 0,
          transferRate: 0,
          eta: 0,
          status: "transferring",
        });
        return;
      } catch (e) {
        console.error("Error parsing string message from data channel:", e);
        return;
      }
    }

    // File data chunk
    if (event.data instanceof ArrayBuffer) {
      this.receivedBuffer.push(event.data);
      this.receivedSize += event.data.byteLength;
    } else {
      // Received data is not an ArrayBuffer, which is unexpected.
      // Try to handle it as a Blob.
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result;
        if (buffer instanceof ArrayBuffer) {
          this.receivedBuffer.push(buffer);
          this.receivedSize += buffer.byteLength;
          this.updateProgress();
        } else {
          console.error(
            "Received data chunk is not a Blob or ArrayBuffer and could not be processed.",
          );
        }
      };
      reader.onerror = () => {
        console.error("Error reading received Blob data.");
      };
      reader.readAsArrayBuffer(event.data);
      return; // Progress will be updated in the onload callback
    }

    this.updateProgress();
  }

  private updateProgress() {
    if (this.fileMetadata) {
      // Cap progress at 100% for display
      const progress = Math.min(
        100,
        (this.receivedSize / this.fileMetadata.size) * 100,
      );
      const elapsedTime = (Date.now() - this.transferStartTime) / 1000;
      const transferRate = this.receivedSize / elapsedTime;
      const eta = (this.fileMetadata.size - this.receivedSize) / transferRate;

      this.onTransferProgressCallback?.({
        fileIndex: 0,
        fileName: this.fileMetadata.name,
        progress,
        transferRate,
        eta: isFinite(eta) ? eta : 0,
        status: "transferring",
      });

      if (this.receivedSize >= this.fileMetadata.size) {
        // File transfer complete
        const file = new Blob(this.receivedBuffer);
        this.onFileReceiveCallback?.(file, this.fileMetadata);

        this.onTransferProgressCallback?.({
          fileIndex: 0,
          fileName: this.fileMetadata.name,
          progress: 100,
          transferRate,
          eta: 0,
          status: "completed",
        });

        // Reset for next file
        this.receivedBuffer = [];
        this.receivedSize = 0;
        this.fileMetadata = null;
      }
    }
  }

  private sendMessage(message: unknown, room: string) {
    this.socket?.emit("message", message, room);
  }

  // Public methods
  connectToClient(targetClientId: string) {
    if (window.devVerboseLogging)
      console.log("SocketService: Connecting to client:", targetClientId);
    if (!this.socket) return;
    this.socket.emit("connect to", targetClientId);
  }

  async sendFiles(files: File[]) {
    if (window.devVerboseLogging)
      console.log(
        "SocketService: Sending files:",
        files.map((f) => f.name),
      );
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      this.onErrorCallback?.("No connection available for file transfer");
      return;
    }

    // Send files sequentially
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      await this.sendSingleFile(file, fileIndex);
    }
  }

  private async sendSingleFile(file: File, fileIndex: number): Promise<void> {
    if (window.devVerboseLogging)
      console.log(
        "SocketService: Sending single file:",
        file.name,
        "size:",
        file.size,
      );
    return new Promise((resolve, reject) => {
      if (!this.dataChannel) {
        reject(new Error("No data channel available"));
        return;
      }

      // Send file metadata
      const metadata: FileMetadata = {
        name: file.name,
        size: file.size,
      };
      if (window.devVerboseLogging)
        console.log("SocketService: Sending file metadata:", metadata);
      this.dataChannel.send(JSON.stringify(metadata));

      let offset = 0;
      const startTime = Date.now();

      const sendNextChunk = () => {
        if (offset >= file.size) {
          this.onTransferProgressCallback?.({
            fileIndex,
            fileName: file.name,
            progress: 100,
            transferRate: file.size / ((Date.now() - startTime) / 1000),
            eta: 0,
            status: "completed",
          });
          resolve();
          return;
        }

        if (this.dataChannel!.bufferedAmount > this.CHUNK_SIZE * 8) {
          this.dataChannel!.onbufferedamountlow = () => {
            this.dataChannel!.onbufferedamountlow = null; // one-time listener
            sendNextChunk();
          };
          return;
        }

        const slice = file.slice(offset, offset + this.CHUNK_SIZE);
        const reader = new FileReader();

        reader.onload = (event) => {
          if (event.target?.result && this.dataChannel) {
            try {
              this.dataChannel.send(event.target.result as ArrayBuffer);
              offset += (event.target.result as ArrayBuffer).byteLength;

              const elapsedTime = (Date.now() - startTime) / 1000;
              const transferRate = offset / elapsedTime;
              const eta = (file.size - offset) / transferRate;
              // Cap progress at 100% for display
              const progress = Math.min(100, (offset / file.size) * 100);

              this.onTransferProgressCallback?.({
                fileIndex,
                fileName: file.name,
                progress,
                transferRate,
                eta: isFinite(eta) ? eta : 0,
                status: "transferring",
              });

              // Use requestAnimationFrame to avoid blocking the event loop on very fast connections
              requestAnimationFrame(sendNextChunk);
            } catch (error) {
              console.error("Error sending chunk:", error);
              reject(error);
            }
          }
        };

        reader.onerror = () => {
          reject(new Error("File read error"));
        };

        reader.readAsArrayBuffer(slice);
      };

      this.dataChannel.bufferedAmountLowThreshold = this.CHUNK_SIZE * 4;
      sendNextChunk();
    });
  }

  // Event handlers
  onClientId(callback: (clientId: string) => void) {
    this.onClientIdCallback = callback;
  }

  onConnectionStatus(callback: (status: ConnectionStatus) => void) {
    this.onConnectionStatusCallback = callback;
  }

  onFileReceive(callback: (file: Blob, metadata: FileMetadata) => void) {
    this.onFileReceiveCallback = callback;
  }

  onTransferProgress(callback: (progress: FileTransferProgress) => void) {
    this.onTransferProgressCallback = callback;
  }

  onMetadataReceive(callback: (metadata: FileMetadata) => void) {
    this.onMetadataReceiveCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  // Cleanup
  disconnect() {
    this.stopServerPing();
    this.stopPeerPing();
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.socket?.disconnect();
  }

  getClientId(): string | null {
    return this.clientId;
  }

  getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this.dataChannel?.readyState === "open",
      clientId: this.clientId!,
      isInitiator: this.isInitiator,
      room: this.room!,
    };
  }
}

export default SocketService;
