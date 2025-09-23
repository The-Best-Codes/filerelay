import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import SocketService, {
  type ConnectionStatus,
  type FileTransferProgress,
} from "@/services/SocketService";
import { getFileIcon } from "@/utils/fileIconUtils";
import { formatFileSize, formatSpeed, formatTime } from "@/utils/fileUtils";
import { triggerHapticFeedback } from "@/utils/haptics";
import { ArrowLeft, CheckCircle2, Loader2, Upload } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

interface FileWithProgress {
  id: string;
  originalIndex: number;
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

  const currentBatchProgress = useRef<Map<number, FileWithProgress> | null>(
    null,
  );

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
    const fileInMap = currentBatchProgress.current?.get(progress.fileIndex);
    if (!fileInMap) {
      return;
    }

    fileInMap.progress = progress.progress;
    fileInMap.status = progress.status;
    fileInMap.transferRate = progress.transferRate;
    fileInMap.eta = progress.eta;

    if (progress.status === "completed" && fileInMap.status !== "completed") {
      triggerHapticFeedback("medium");
    }

    if (currentBatchProgress.current) {
      const totalFiles = currentBatchProgress.current.size;
      let sumOfAllProgress = 0;
      let anyWaitingOrTransferring = false;
      let allSuccessfullyCompleted = true;

      currentBatchProgress.current.forEach((fwp) => {
        sumOfAllProgress += fwp.progress;
        if (fwp.status === "waiting" || fwp.status === "transferring") {
          anyWaitingOrTransferring = true;
        }
        if (fwp.status !== "completed") {
          allSuccessfullyCompleted = false;
        }
      });

      setOverallProgress(totalFiles > 0 ? sumOfAllProgress / totalFiles : 0);
      setIsSending(anyWaitingOrTransferring);

      if (!anyWaitingOrTransferring && allSuccessfullyCompleted) {
        setTimeout(() => {
          setFiles([]);
          setTransferCompleted(true);
          currentBatchProgress.current = null;
        }, 100);
      }
    } else {
      setOverallProgress(0);
      setIsSending(false);
    }

    setFiles((prev) => {
      const updatedFiles = prev.map((fileItem) => {
        if (fileItem.originalIndex === progress.fileIndex) {
          return {
            ...fileItem,
            progress: progress.progress,
            status: progress.status,
            transferRate: progress.transferRate,
            eta: progress.eta,
          };
        }
        return fileItem;
      });
      return updatedFiles.filter((f) => f.status !== "completed");
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
    triggerHapticFeedback("light");
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addFiles = (newFiles: File[]) => {
    setFiles([]);
    setTransferCompleted(false);
    setOverallProgress(0);

    if (newFiles.length === 0) {
      setIsSending(false);
      return;
    }

    currentBatchProgress.current = new Map<number, FileWithProgress>();
    const filesWithProgress: FileWithProgress[] = newFiles.map(
      (file, index) => {
        const fileItem: FileWithProgress = {
          id: crypto.randomUUID(),
          originalIndex: index,
          file,
          progress: 0,
          status: "waiting" as const,
        };
        currentBatchProgress.current?.set(index, fileItem);
        return fileItem;
      },
    );

    setFiles(filesWithProgress);
    setIsSending(true);

    if (socketServiceRef.current) {
      socketServiceRef.current.sendFiles(newFiles);
    }
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
      <div className="flex-1 flex justify-center items-center p-4 pt-20 overflow-auto">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Setting up connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex justify-center items-start p-4 pt-20 overflow-auto">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Send Files</h1>
          </div>
        </div>

        {!connectionStatus.isConnected ? (
          <>
            <div className="rounded-lg border bg-background p-6">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Scan this QR code with your other device
                  </h2>
                </div>

                {qrCodeUrl && (
                  <div className="flex flex-col items-center space-y-4">
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
                      <div className="bg-muted px-4 py-3 rounded-lg font-mono text-base font-semibold">
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
            {!isSending && !transferCompleted && (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragOver ? "border-primary bg-primary/5" : "border-border"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFiles}
              >
                <Upload className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drop files here or{" "}
                    <span className="text-blue-600 dark:text-blue-400">
                      browse
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can select multiple files. Files will be sent
                    immediately once you select them.
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
            )}

            {files.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {files.length} file{files.length !== 1 ? "s" : ""}{" "}
                      {isSending ? "remaining" : "with issues"}
                    </span>
                    {isSending && overallProgress > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ({Math.round(overallProgress)}%)
                      </span>
                    )}
                  </div>
                </div>
                {isSending && (
                  <Progress value={overallProgress} className="w-full" />
                )}
                <div className="mt-2 space-y-3">
                  {files.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="w-full border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFileIcon(fileItem.file)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-base">
                              {fileItem.file.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(fileItem.file.size)}
                              {fileItem.status === "error" && (
                                <span className="ml-2 text-red-500">
                                  {" "}
                                  (Error)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(fileItem.progress > 0 ||
                        fileItem.status === "error") && (
                        <div className="space-y-2 mt-2">
                          {fileItem.status !== "error" && (
                            <Progress value={fileItem.progress} />
                          )}
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {fileItem.status === "error"
                                ? "Failed"
                                : `${Math.round(fileItem.progress)}%`}
                            </span>
                            {!fileItem.status ||
                            fileItem.status === "waiting" ||
                            fileItem.status === "transferring" ? (
                              <div className="flex gap-3">
                                {fileItem.transferRate && (
                                  <span>
                                    Speed: {formatSpeed(fileItem.transferRate)}
                                  </span>
                                )}
                                {fileItem.eta !== undefined &&
                                  fileItem.eta > 0 && (
                                    <span>ETA: {formatTime(fileItem.eta)}</span>
                                  )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transferCompleted && (
              <div className="mt-4 flex flex-col items-center justify-center p-8 text-center rounded-lg border bg-background">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-3" />
                <p className="font-semibold mb-4 text-xl">
                  All files have been sent.
                </p>
                <Button onClick={() => setTransferCompleted(false)}>
                  Send More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
