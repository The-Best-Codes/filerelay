import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import SocketService, {
  type ConnectionStatus,
  type FileMetadata,
} from "@/services/SocketService";
import { getFileIcon } from "@/utils/fileIconUtils";
import { formatFileSize, formatSpeed, formatTime } from "@/utils/fileUtils";
import { triggerHapticFeedback } from "@/utils/haptics";
import { ArrowLeft, CheckCircle2, Download, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

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
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
  });
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketServiceRef = useRef<SocketService | null>(null);

  useEffect(() => {
    if (clientIdFromUrl) {
      connectToSender(clientIdFromUrl);
    } else {
      navigate("/enter-code");
    }
  }, [clientIdFromUrl, navigate]);

  const connectToSender = async (targetClientId: string) => {
    if (!targetClientId.trim()) {
      setError("Please enter a valid client ID");
      return;
    }

    setError(null);

    try {
      const socketService = new SocketService();
      socketServiceRef.current = socketService;

      socketService.onConnectionStatus((status) => {
        setConnectionStatus(status);
        if (status.isConnected) {
          setIsLoading(false);
          triggerHapticFeedback("medium");
        }
      });

      socketService.onMetadataReceive((metadata) => {
        setReceivedFiles((prev) => {
          const existingIndex = prev.findIndex(
            (f) => f.metadata.name === metadata.name,
          );
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              metadata,
            };
            return updated;
          } else {
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
        setIsLoading(false);
      });

      setTimeout(() => {
        socketService.connectToClient(targetClientId);
      }, 1000);
    } catch {
      setError("Failed to establish connection");
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Connecting to sender...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Receive Files</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {receivedFiles.length > 0 && (
        <div className="space-y-3">
          {receivedFiles.map((file, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file.metadata.name)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-base">
                      {file.metadata.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {file.metadata.size > 0
                        ? formatFileSize(file.metadata.size)
                        : "Size unknown"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={file.status !== "completed"}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>

              {file.status === "receiving" && file.progress > 0 && (
                <div className="space-y-2 mt-2">
                  <Progress value={file.progress} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(file.progress)}%</span>
                    <div className="flex gap-3">
                      {file.transferRate && (
                        <span>Speed: {formatSpeed(file.transferRate)}</span>
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
      )}

      {connectionStatus.isConnected && receivedFiles.length === 0 && (
        <div className="rounded-lg border bg-background p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-3" />
            <h2 className="text-xl font-semibold mb-2">
              Ready to receive files!
            </h2>
            <p className="text-base text-muted-foreground text-center">
              Start sending files from your other device and they'll appear here
              for download
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
