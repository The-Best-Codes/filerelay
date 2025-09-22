import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import SocketService, {
  type ConnectionStatus,
  type FileTransferProgress,
} from "@/services/SocketService";
import { triggerHapticFeedback } from "@/utils/haptics";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  File,
  FileText,
  Image,
  Loader2,
  Music,
  Upload,
  Video,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

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
  const [transferCompleted, setTransferCompleted] = useState(false);
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

          if (
            progress.status === "completed" &&
            fileItem.status !== "completed"
          ) {
            triggerHapticFeedback("medium");
          }

          return updatedFile;
        }
        return fileItem;
      });

      const totalProgress = updated.reduce(
        (sum, file) => sum + file.progress,
        0,
      );
      setOverallProgress(
        updated.length > 0 ? totalProgress / updated.length : 0,
      );

      const allCompleted =
        updated.length > 0 && updated.every((f) => f.status === "completed");

      if (allCompleted) {
        setTimeout(() => {
          setFiles([]);
          setTransferCompleted(true);
        }, 0);
      }

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
    setTransferCompleted(false);
    setOverallProgress(0);
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
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Setting up connection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Send Files</h1>
        </div>
      </div>

      {!connectionStatus.isConnected ? (
        <>
          <div className="rounded-lg border bg-background p-4 md:p-6">
            <div className="text-center space-y-4 md:space-y-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-2">
                  Scan this QR code with your other device
                </h2>
              </div>

              {qrCodeUrl && (
                <div className="flex flex-col items-center space-y-3 md:space-y-4">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-56 h-56 md:w-64 md:h-64 border-2 border-border rounded-lg"
                  />
                  <div className="text-center">
                    <p className="text-sm text-foreground mb-2">
                      If you can't, choose "Enter Code" and enter this code
                      manually:
                    </p>
                    <div className="bg-muted px-3 py-2 md:px-4 md:py-3 rounded-lg font-mono text-sm md:text-base font-semibold">
                      {clientId}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-colors cursor-pointer ${
              isDragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseFiles}
          >
            <Upload className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-muted-foreground" />
            <div className="space-y-1 md:space-y-2">
              <p className="text-sm md:text-lg font-medium">
                Drop files here or <span className="text-blue-500">browse</span>
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                You can select multiple files. Files will be sent immediately
                once you select them.
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

          {files.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </span>
                  {overallProgress > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({Math.round(overallProgress)}%)
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleSendFiles}
                  disabled={
                    !connectionStatus.isConnected ||
                    isSending ||
                    files.length === 0
                  }
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span className="inline">Send Files</span>
                    </>
                  )}
                </Button>
              </div>

              {overallProgress > 0 && files.length > 0 && (
                <Progress value={overallProgress} className="w-full" />
              )}
              {(files.length > 0 || transferCompleted) && (
                <div className="mt-2">
                  {files.length > 0 ? (
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
                          <div className="flex items-center justify-between">
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
                            <div className="space-y-1 md:space-y-2 mt-2">
                              <Progress value={fileItem.progress} />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{Math.round(fileItem.progress)}%</span>
                                <div className="flex gap-2 md:gap-4">
                                  {fileItem.transferRate && (
                                    <span>
                                      Speed:{" "}
                                      {formatSpeed(fileItem.transferRate)}
                                    </span>
                                  )}
                                  {fileItem.eta !== undefined &&
                                    fileItem.eta > 0 && (
                                      <span>
                                        ETA: {formatTime(fileItem.eta)}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                      <p className="font-semibold">All files have been sent.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
