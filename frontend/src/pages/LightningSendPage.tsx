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
  const [chunkSize, setChunkSize] = useState(90 * 1024 * 1024); // 90MB default
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const lastLoadedRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    const storedCode = sessionStorage.getItem("lightning_code");
    if (!storedCode) {
      console.warn(
        "LightningSendPage.tsx: No access code in sessionStorage, redirecting to auth",
      );
      navigate("/lightning-auth");
      return;
    }

    fetch("/api/lightning-config")
      .then((res) => res.json())
      .then((config) => {
        if (config.chunkSize) {
          setChunkSize(config.chunkSize);
        }
      })
      .catch((err) => console.error("Failed to fetch lightning config:", err));

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

  const calculateSpeedAndETA = (totalLoaded: number, totalSize: number) => {
    const now = Date.now();
    if (now - lastTimestampRef.current < 500) {
      return {};
    }

    const timeDiff = now - lastTimestampRef.current;
    const bytesDiff = totalLoaded - lastLoadedRef.current;

    lastLoadedRef.current = totalLoaded;
    lastTimestampRef.current = now;

    if (timeDiff > 0) {
      const rate = (bytesDiff / timeDiff) * 1000; // bytes per second
      if (rate > 0) {
        const remaining = totalSize - totalLoaded;
        const eta = remaining / rate;
        return { transferRate: rate, eta };
      }
    }
    return { transferRate: 0, eta: undefined };
  };

  const startUpload = async (file: File) => {
    isCancelledRef.current = false;
    const storedCode = sessionStorage.getItem("lightning_code");
    if (!storedCode) {
      setFileProgress({
        file,
        progress: 0,
        status: "error",
        error: "Access code not found",
      });
      return;
    }

    setFileProgress({ file, progress: 0, status: "uploading" });

    try {
      const initRes = await fetch("/api/lightning-upload-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: storedCode,
          originalname: file.name,
          size: file.size,
        }),
      });

      if (!initRes.ok) {
        const errorData = await initRes.json();
        throw new Error(errorData.error || "Failed to initialize upload");
      }

      const { id: newFileId } = await initRes.json();
      setFileId(newFileId);

      const totalChunks = Math.ceil(file.size / chunkSize);
      lastLoadedRef.current = 0;
      lastTimestampRef.current = Date.now();

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (isCancelledRef.current) {
          console.log("Upload cancelled by user.");
          return;
        }

        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("code", storedCode);
        formData.append("id", newFileId);
        formData.append("chunkIndex", String(chunkIndex));
        formData.append("totalChunks", String(totalChunks));

        await uploadChunk(formData, chunkIndex, file.size);
      }

      if (!isCancelledRef.current) {
        setUploadCompleted(true);
        generateQRCode(newFileId);
        setFileProgress((prev) => ({ ...prev, status: "completed" }));
        triggerHapticFeedback("medium");
      }
    } catch (error) {
      if ((error as Error).message === "Upload aborted") {
        setFileProgress({ file: null, progress: 0, status: "idle" });
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setFileProgress((prev) => ({
        ...prev,
        status: "error",
        error: errorMessage,
      }));
    }
  };

  const uploadChunk = (
    formData: FormData,
    chunkIndex: number,
    totalSize: number,
  ) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.open("POST", "/api/lightning-upload-chunk");

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const chunksLoadedSize = chunkIndex * chunkSize;
          const totalLoaded = chunksLoadedSize + e.loaded;
          const progress = calculateProgress(totalLoaded, totalSize);
          const { transferRate, eta } = calculateSpeedAndETA(
            totalLoaded,
            totalSize,
          );
          setFileProgress((prev) => ({
            ...prev,
            progress,
            status: "uploading",
            ...(transferRate !== undefined && { transferRate }),
            ...(eta !== undefined && { eta }),
          }));
        }
      });

      xhr.addEventListener("load", () => {
        xhrRef.current = null;
        if (xhr.status === 200) {
          resolve();
        } else {
          let errorMsg = `Upload failed: ${xhr.status}`;
          try {
            const response = JSON.parse(xhr.responseText);
            if (response && response.error) errorMsg = response.error;
          } catch {
            // ignore
          }
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener("error", () => {
        xhrRef.current = null;
        reject(new Error("Upload error"));
      });

      xhr.addEventListener("abort", () => {
        xhrRef.current = null;
        reject(new Error("Upload aborted"));
      });

      xhr.send(formData);
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 0) {
        startUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    triggerHapticFeedback("light");
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 0) {
        startUpload(file);
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
    isCancelledRef.current = true;
    if (xhrRef.current) {
      xhrRef.current.abort();
    } else {
      setFileProgress({ file: null, progress: 0, status: "idle" });
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
            <Button onClick={() => window.location.reload()} className="w-full">
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
            {fileProgress.status === "error" && (
              <Button
                onClick={() =>
                  setFileProgress({ file: null, progress: 0, status: "idle" })
                }
                className="w-full"
              >
                Try Again
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
