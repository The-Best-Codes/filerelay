import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getFileIcon } from "@/utils/fileIconUtils";
import { formatFileSize, formatSpeed, formatTime } from "@/utils/fileUtils";
import { triggerHapticFeedback } from "@/utils/haptics";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

interface FileProgress {
  file: File | null;
  progress: number;
  status: "idle" | "uploading" | "completed" | "error";
  transferRate?: number;
  eta?: number;
  error?: string;
}

export default function LightningSendPage() {
  if (window.devVerboseLogging)
    console.log(
      "LightningSendPage.tsx: LightningSendPage component initialized",
    );
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress>({
    file: null,
    progress: 0,
    status: "idle",
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [fileId, setFileId] = useState("");
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const uploadStartTimeRef = useRef<number>(0);
  const lastLoadedRef = useRef<number>(0);

  useEffect(() => {
    const storedCode = sessionStorage.getItem("lightning_code");
    if (!storedCode) {
      console.warn(
        "LightningSendPage.tsx: No access code in sessionStorage, redirecting to auth",
      );
      navigate("/lightning-auth");
      return;
    }
    setIsLoading(false);
    return () => {
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, [navigate]);

  const generateQRCode = async (id: string) => {
    try {
      const baseUrl =
        import.meta.env.VITE_BASE_URL ||
        `${window.location.protocol}//${window.location.host}`;
      const receiveUrl = `${baseUrl}/lightning-receive?file-id=${id}`;
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

  const calculateProgress = (loaded: number, total: number) => {
    return total > 0 ? (loaded / total) * 100 : 0;
  };

  const calculateSpeedAndETA = (loaded: number, total: number) => {
    const now = Date.now();
    const timeDiff = now - uploadStartTimeRef.current;
    if (timeDiff > 0) {
      const bytesDiff = loaded - lastLoadedRef.current;
      const rate = (bytesDiff / timeDiff) * 1000; // bytes per second
      lastLoadedRef.current = loaded;
      if (rate > 0) {
        const remaining = total - loaded;
        const eta = remaining / rate;
        return { transferRate: rate, eta };
      }
    }
    return { transferRate: 0, eta: undefined };
  };

  const uploadFile = (file: File) => {
    const storedCode = sessionStorage.getItem("lightning_code");
    if (!storedCode) {
      setFileProgress((prev) => ({
        ...prev,
        status: "error",
        error: "Access code not found",
      }));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    uploadStartTimeRef.current = Date.now();
    lastLoadedRef.current = 0;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("code", storedCode);

    xhr.open("POST", "/api/lightning-upload");
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const progress = calculateProgress(e.loaded, e.total);
        const { transferRate, eta } = calculateSpeedAndETA(e.loaded, e.total);
        setFileProgress((prev) => ({
          ...prev,
          progress,
          transferRate,
          eta,
          status: "uploading",
        }));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          setFileId(response.id);
          generateQRCode(response.id);
          setUploadCompleted(true);
          setFileProgress((prev) => ({ ...prev, status: "completed" }));
          triggerHapticFeedback("medium");
        } catch {
          setFileProgress((prev) => ({
            ...prev,
            status: "error",
            error: "Invalid response",
          }));
        }
      } else {
        let errorMsg = `Upload failed: ${xhr.status}`;
        try {
          const response = JSON.parse(xhr.responseText);
          if (response && response.error) {
            errorMsg = response.error;
          }
        } catch {
          // Ignore parse error, use default message
        }
        setFileProgress((prev) => ({
          ...prev,
          status: "error",
          error: errorMsg,
        }));
      }
      xhrRef.current = null;
    });

    xhr.addEventListener("error", () => {
      setFileProgress((prev) => ({
        ...prev,
        status: "error",
        error: "Upload error",
      }));
      xhrRef.current = null;
    });

    xhr.addEventListener("abort", () => {
      setFileProgress((prev) => ({ ...prev, status: "idle" }));
      xhrRef.current = null;
    });

    xhr.send(formData);
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 0) {
        // Basic validation
        setFileProgress({ file, progress: 0, status: "idle" });
        uploadFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    triggerHapticFeedback("light");
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 0) {
        setFileProgress({ file, progress: 0, status: "idle" });
        uploadFile(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBack = () => {
    if (window.devVerboseLogging)
      console.log("LightningSendPage.tsx: User clicked Back, navigating to /");
    triggerHapticFeedback("light");
    navigate("/");
  };

  const handleBrowseFiles = () => {
    if (window.devVerboseLogging)
      console.log("LightningSendPage.tsx: User clicked browse files");
    triggerHapticFeedback("light");
    fileInputRef.current?.click();
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center p-4 pt-20 overflow-auto">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
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
            <h1 className="text-2xl font-bold">Lightning Send</h1>
          </div>
        </div>

        {uploadCompleted ? (
          <div className="text-center space-y-6">
            {qrCodeUrl && (
              <div className="space-y-4">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 mx-auto border-2 border-border rounded-lg"
                />
                <div className="bg-muted px-4 py-3 rounded-lg font-mono text-base overflow-hidden">
                  <a
                    href={`/lightning-receive?file-id=${fileId}`}
                    className="text-primary hover:underline break-all"
                  >
                    {window.location.origin}/lightning-receive?file-id={fileId}
                  </a>
                </div>
              </div>
            )}
            <Button onClick={handleBack} className="w-full">
              Upload Another File
            </Button>
          </div>
        ) : fileProgress.file ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(fileProgress.file)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-base">
                    {fileProgress.file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(fileProgress.file.size)}
                  </p>
                </div>
              </div>
              {fileProgress.status === "error" && (
                <span className="text-sm text-destructive">Error</span>
              )}
            </div>

            {fileProgress.status !== "idle" && (
              <div className="space-y-2">
                <Progress value={fileProgress.progress} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {fileProgress.status === "error"
                      ? "Failed"
                      : `${Math.round(fileProgress.progress)}%`}
                  </span>
                  {fileProgress.status === "uploading" && (
                    <div className="flex gap-3 tabular-nums">
                      {fileProgress.transferRate &&
                        fileProgress.transferRate > 0 && (
                          <span>
                            Speed: {formatSpeed(fileProgress.transferRate)}
                          </span>
                        )}
                      {fileProgress.eta !== undefined &&
                        fileProgress.eta > 0 && (
                          <span>ETA: {formatTime(fileProgress.eta)}</span>
                        )}
                    </div>
                  )}
                </div>
                {fileProgress.error && (
                  <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                    {fileProgress.error}
                  </div>
                )}
              </div>
            )}

            {fileProgress.status === "uploading" && (
              <Button
                variant="outline"
                onClick={handleCancelUpload}
                className="w-full"
              >
                Cancel Upload
              </Button>
            )}
          </div>
        ) : (
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
                Drop a file here or <span className="text-primary">browse</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Select one file to upload via Lightning File Transfer.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
