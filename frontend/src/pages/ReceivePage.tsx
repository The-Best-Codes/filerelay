import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  QrCode,
  ArrowLeft,
  Loader2,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Users,
  Wifi,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SocketService, {
  type FileMetadata,
  type ConnectionStatus,
} from "@/services/SocketService";
import { triggerHapticFeedback } from "@/utils/haptics";

interface ReceivedFile {
  blob: Blob;
  metadata: FileMetadata;
  progress: number;
  status: "receiving" | "completed";
  transferRate?: number;
  eta?: number;
  downloadUrl?: string;
}

export default function ReceivePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get("client-id");

  const [isLoading, setIsLoading] = useState(!!clientIdFromUrl);
  const [clientIdInput, setClientIdInput] = useState(clientIdFromUrl || "");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
  });
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketServiceRef = useRef<SocketService | null>(null);

  useEffect(() => {
    if (clientIdFromUrl) {
      connectToSender(clientIdFromUrl);
    }
  }, [clientIdFromUrl]);

  const connectToSender = async (targetClientId: string) => {
    if (!targetClientId.trim()) {
      setError("Please enter a valid client ID");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const socketService = new SocketService();
      socketServiceRef.current = socketService;

      socketService.onConnectionStatus((status) => {
        setConnectionStatus(status);
        if (status.isConnected) {
          setIsLoading(false);
          setIsConnecting(false);
          triggerHapticFeedback("medium");
        }
      });

      socketService.onMetadataReceive((metadata) => {
        setReceivedFiles((prev) => {
          const existingIndex = prev.findIndex(
            (f) => f.metadata.name === metadata.name,
          );
          if (existingIndex >= 0) {
            // Update existing file with proper metadata
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              metadata,
            };
            return updated;
          } else {
            // Create new file entry with metadata
            return [
              ...prev,
              {
                blob: new Blob(),
                metadata,
                progress: 0,
                status: "receiving",
                transferRate: 0,
                eta: 0,
              },
            ];
          }
        });
      });

      socketService.onFileReceive((blob, metadata) => {
        triggerHapticFeedback("medium");
        const downloadUrl = URL.createObjectURL(blob);
        setReceivedFiles((prev) => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(
            (f) => f.metadata.name === metadata.name,
          );
          if (existingIndex >= 0) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              blob,
              metadata,
              downloadUrl,
              progress: 100,
              status: "completed",
            };
          }
          return updated;
        });
      });

      socketService.onTransferProgress((progress) => {
        if (progress.status === "transferring") {
          setReceivedFiles((prev) => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(
              (f) => f.metadata.name === progress.fileName,
            );
            if (existingIndex >= 0) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                progress: progress.progress,
                transferRate: progress.transferRate,
                eta: progress.eta,
                status: "receiving",
              };
            }
            return updated;
          });
        }
      });

      socketService.onError((errorMsg) => {
        setError(errorMsg);
        setIsConnecting(false);
        setIsLoading(false);
      });

      setTimeout(() => {
        socketService.connectToClient(targetClientId);
      }, 1000);
    } catch {
      setError("Failed to establish connection");
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    triggerHapticFeedback("light");
    connectToSender(clientIdInput);
  };

  const handleDownload = (file: ReceivedFile) => {
    triggerHapticFeedback("light");
    if (file.downloadUrl) {
      const link = document.createElement("a");
      link.href = file.downloadUrl;
      link.download = file.metadata.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleBack = () => {
    triggerHapticFeedback("light");
    navigate("/");
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split(".").pop() || "";
    const className = "h-5 w-5";

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
      return <Image className={className} />;
    if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext))
      return <Video className={className} />;
    if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext))
      return <Music className={className} />;
    if (["zip", "rar", "tar", "7z", "gz"].includes(ext))
      return <Archive className={className} />;
    if (["txt", "doc", "docx", "pdf", "rtf"].includes(ext))
      return <FileText className={className} />;
    return <File className={className} />;
  };

  const getStatusIcon = (status: string) => {
    const className = "h-4 w-4";

    switch (status) {
      case "receiving":
        return <Loader2 className={`${className} text-primary animate-spin`} />;
      case "completed":
        return <CheckCircle2 className={`${className} text-primary`} />;
      default:
        return <Clock className={`${className} text-muted-foreground`} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatFileSize(bytesPerSecond) + "/s";
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Connecting to sender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-4">
      <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Back</span>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Receive Files</h1>
          </div>
        </div>

        {/* Connection Card */}
        {!connectionStatus.isConnected && !clientIdFromUrl && (
          <Card className="p-3 md:p-6">
            <CardHeader className="p-0 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <QrCode className="h-4 w-4 md:h-5 md:w-5" />
                Connect to Sender
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 md:space-y-4">
              <div className="space-y-2">
                <p className="text-xs md:text-sm text-muted-foreground">
                  Scan the QR code on the sending device or enter the code
                  manually:
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter sender's code"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleConnect()}
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting || !clientIdInput.trim()}
                    size="sm"
                    className="min-w-[80px]"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span className="sm:hidden">Go</span>
                        <span className="hidden sm:inline">Connect</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        {(connectionStatus.isConnected || isConnecting) && (
          <Card className="p-3 md:p-6">
            <CardHeader className="p-0 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Users className="h-4 w-4 md:h-5 md:w-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center gap-2">
                {connectionStatus.isConnected ? (
                  <>
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-primary rounded-full animate-pulse" />
                    <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs md:text-sm font-medium">
                      Connected and ready to receive files!
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-muted-foreground rounded-full animate-pulse" />
                    <Wifi className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Connecting to sender...
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Received Files */}
        {receivedFiles.length > 0 && (
          <Card className="p-3 md:p-6">
            <CardHeader className="p-0 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Download className="h-4 w-4 md:h-5 md:w-5" />
                Received Files
                <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                  {receivedFiles.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 md:space-y-3">
                {receivedFiles.map((file, index) => (
                  <div key={index} className="border rounded-lg p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        {getFileIcon(file.metadata.name)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm md:text-base">
                            {file.metadata.name}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {file.metadata.size > 0
                              ? formatFileSize(file.metadata.size)
                              : "Size unknown"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(file.status)}
                          <span className="hidden md:inline text-xs text-muted-foreground capitalize">
                            {file.status === "receiving"
                              ? "Receiving"
                              : "Complete"}
                          </span>
                        </div>
                      </div>
                      {file.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          className="h-8 min-w-[80px]"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">
                            Download
                          </span>
                        </Button>
                      )}
                    </div>

                    {file.status === "receiving" && file.progress > 0 && (
                      <div className="space-y-1 md:space-y-2">
                        <Progress value={file.progress} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.round(file.progress)}%</span>
                          <div className="flex gap-2 md:gap-4">
                            {file.transferRate && (
                              <span>
                                Speed: {formatSpeed(file.transferRate)}
                              </span>
                            )}
                            {file.eta !== undefined && file.eta > 0 && (
                              <span>ETA: {formatTime(file.eta)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {connectionStatus.isConnected && receivedFiles.length === 0 && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Connected! The sender can now start transferring files to you.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
