import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  X,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Users,
  Wifi,
  QrCode,
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import SocketService, {
  type FileTransferProgress,
  type ConnectionStatus,
} from "@/services/SocketService";
import { triggerHapticFeedback } from "@/utils/haptics";

interface FileWithProgress {
  file: File;
  progress: number;
  status: "waiting" | "transferring" | "completed" | "error";
  transferRate?: number;
  eta?: number;
}

export default function SendPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketServiceRef = useRef<SocketService | null>(null);

  useEffect(() => {
    const socketService = new SocketService();
    socketServiceRef.current = socketService;

    socketService.onClientId((id) => {
      setClientId(id);
      generateQRCode(id);
      setIsLoading(false);
    });

    socketService.onConnectionStatus((status) => {
      setConnectionStatus(status);
      if (status.isConnected) {
        triggerHapticFeedback("medium");
      }
    });

    socketService.onTransferProgress((progress) => {
      updateFileProgress(progress);
    });

    socketService.onError((error) => {
      console.error("Socket error:", error);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const generateQRCode = async (id: string) => {
    try {
      const baseUrl =
        import.meta.env.VITE_BASE_URL ||
        `${window.location.protocol}//${window.location.host}`;
      const receiveUrl = `${baseUrl}/receive?client-id=${id}`;
      const qrUrl = await QRCode.toDataURL(receiveUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#1f2937",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const updateFileProgress = (progress: FileTransferProgress) => {
    setFiles((prev) => {
      const updated = prev.map((fileItem, index) => {
        if (index === progress.fileIndex) {
          const updatedFile = {
            ...fileItem,
            progress: progress.progress,
            status: progress.status,
            transferRate: progress.transferRate,
            eta: progress.eta,
          };

          // Trigger haptic feedback when file completes
          if (
            progress.status === "completed" &&
            fileItem.status !== "completed"
          ) {
            triggerHapticFeedback("medium");

            // Remove completed file after animation
            setTimeout(() => {
              setFiles((current) => current.filter((_, i) => i !== index));
            }, 2000);
          }

          return updatedFile;
        }
        return fileItem;
      });

      // Update overall progress
      const totalProgress = updated.reduce(
        (sum, file) => sum + file.progress,
        0,
      );
      setOverallProgress(
        updated.length > 0 ? totalProgress / updated.length : 0,
      );

      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    triggerHapticFeedback("light");
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    triggerHapticFeedback("light");
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const filesWithProgress: FileWithProgress[] = newFiles.map((file) => ({
      file,
      progress: 0,
      status: "waiting" as const,
    }));
    setFiles((prev) => [...prev, ...filesWithProgress]);
  };

  const removeFile = (index: number) => {
    triggerHapticFeedback("light");
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    const className = "h-5 w-5";

    if (type.startsWith("image/")) return <Image className={className} />;
    if (type.startsWith("video/")) return <Video className={className} />;
    if (type.startsWith("audio/")) return <Music className={className} />;
    if (type.includes("zip") || type.includes("rar") || type.includes("tar"))
      return <Archive className={className} />;
    if (type.includes("text") || type.includes("document"))
      return <FileText className={className} />;
    return <File className={className} />;
  };

  const getStatusIcon = (status: string) => {
    const className = "h-4 w-4";

    switch (status) {
      case "waiting":
        return <Clock className={`${className} text-muted-foreground`} />;
      case "transferring":
        return <Loader2 className={`${className} text-primary animate-spin`} />;
      case "completed":
        return <CheckCircle2 className={`${className} text-primary`} />;
      case "error":
        return <X className={`${className} text-destructive`} />;
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

  const handleSendFiles = async () => {
    if (!socketServiceRef.current || files.length === 0) return;

    triggerHapticFeedback("medium");
    setIsSending(true);
    try {
      const filesToSend = files.map((f) => f.file);
      await socketServiceRef.current.sendFiles(filesToSend);
    } catch (error) {
      console.error("Error sending files:", error);
    }
    setIsSending(false);
  };

  const handleBack = () => {
    triggerHapticFeedback("light");
    navigate("/");
  };

  const handleBrowseFiles = () => {
    triggerHapticFeedback("light");
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Setting up connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-4">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Back</span>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Send Files</h1>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* QR Code and Connection Status */}
          <Card className="p-3 md:p-6">
            <CardHeader className="p-0 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <QrCode className="h-4 w-4 md:h-5 md:w-5" />
                Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 md:space-y-4">
              {qrCodeUrl && (
                <div className="flex flex-col items-center space-y-2 md:space-y-3">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-32 h-32 md:w-64 md:h-64 border-2 border-border rounded-lg"
                  />
                  <div className="text-center">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">
                      Or enter this code manually:
                    </p>
                    <div className="bg-muted px-2 py-1 md:px-3 md:py-2 rounded-md font-mono text-xs md:text-sm">
                      {clientId}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {connectionStatus.isConnected ? (
                  <>
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-primary rounded-full animate-pulse" />
                    <Users className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs md:text-sm font-medium">
                      Connected
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-muted-foreground rounded-full animate-pulse" />
                    <Wifi className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Waiting for receiver...
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          <Card className="p-3 md:p-6">
            <CardHeader className="p-0 pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Upload className="h-4 w-4 md:h-5 md:w-5" />
                Files to Send
                {files.length > 0 && (
                  <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                    {files.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center transition-colors ${
                  isDragOver ? "border-primary bg-primary/5" : "border-border"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-muted-foreground" />
                <div className="space-y-1 md:space-y-2">
                  <p className="text-sm md:text-lg font-medium">
                    Drop files here or{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={handleBrowseFiles}
                    >
                      browse
                    </Button>
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Add multiple files to send them all at once
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <Card className="p-3 md:p-6">
            <CardHeader className="p-0 pb-3 md:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg">
                  File Queue
                </CardTitle>
                <div className="flex items-center gap-2 md:gap-4">
                  {overallProgress > 0 && (
                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Overall: {Math.round(overallProgress)}%</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSendFiles}
                    disabled={
                      !connectionStatus.isConnected ||
                      isSending ||
                      files.length === 0
                    }
                    className="min-w-[80px] md:min-w-[100px]"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">
                          Send Files
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {overallProgress > 0 && (
                <Progress value={overallProgress} className="w-full" />
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 md:space-y-3">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 md:p-4 transition-all duration-500 ease-out ${
                      fileItem.status === "completed"
                        ? "opacity-0 transform -translate-y-2 scale-95"
                        : "opacity-100 transform translate-y-0 scale-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        {getFileIcon(fileItem.file)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm md:text-base">
                            {fileItem.file.name}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {formatFileSize(fileItem.file.size)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(fileItem.status)}
                          <span className="hidden md:inline text-xs text-muted-foreground capitalize">
                            {fileItem.status === "waiting"
                              ? "Queued"
                              : fileItem.status === "transferring"
                                ? "Sending"
                                : fileItem.status === "completed"
                                  ? "Sent"
                                  : "Error"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={fileItem.status === "transferring"}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {fileItem.progress > 0 && (
                      <div className="space-y-1 md:space-y-2">
                        <Progress value={fileItem.progress} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Math.round(fileItem.progress)}%</span>
                          <div className="flex gap-2 md:gap-4">
                            {fileItem.transferRate && (
                              <span>
                                Speed: {formatSpeed(fileItem.transferRate)}
                              </span>
                            )}
                            {fileItem.eta !== undefined && fileItem.eta > 0 && (
                              <span>ETA: {formatTime(fileItem.eta)}</span>
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

        {!connectionStatus.isConnected && (
          <Alert>
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              Share the QR code or client ID with the receiving device. Both
              devices must be on the same WiFi network.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
