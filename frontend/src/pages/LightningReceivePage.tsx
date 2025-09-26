import { Button } from "@/components/ui/button";
import { getFileIcon } from "@/utils/fileIconUtils";
import { formatFileSize } from "@/utils/fileUtils";
import { AlertCircle, ArrowLeft, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

interface FileMetadata {
  originalname: string;
  size: number;
  upload_time: string;
}

interface ApiResponse {
  success: boolean;
  data?: FileMetadata;
  error?: string;
}

export default function LightningReceivePage() {
  if (window.devVerboseLogging)
    console.log(
      "LightningReceivePage.tsx: LightningReceivePage component initialized",
    );
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get("file-id");
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setError("No file ID provided");
      setIsLoading(false);
      return;
    }

    if (window.devVerboseLogging)
      console.log(
        "LightningReceivePage.tsx: Fetching metadata for file ID:",
        fileId,
      );

    const fetchMetadata = async () => {
      try {
        const response = await fetch(`/api/lightning-metadata/${fileId}`);
        const result: ApiResponse = await response.json();

        if (response.ok && result.success && result.data) {
          setMetadata(result.data);
        } else {
          setError(result.error || "File not found or expired");
        }
      } catch (err) {
        setError("Failed to load file information");
        console.error("Error fetching metadata:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [fileId]);

  const handleBack = () => {
    if (window.devVerboseLogging)
      console.log(
        "LightningReceivePage.tsx: User clicked Back, navigating to /",
      );
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center p-4 pt-20 overflow-auto">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading file...</p>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className="flex-1 flex justify-center items-center p-4 pt-20 overflow-auto">
        <div className="max-w-md w-full mx-auto space-y-6 text-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Lightning Receive</h1>
            </div>
          </div>
          <div className="space-y-4">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Unable to Load File
              </h2>
              <p className="text-muted-foreground">
                {error || "File not found"}
              </p>
            </div>
            <Button onClick={handleBack} className="w-full">
              Go Back Home
            </Button>
          </div>
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
            <h1 className="text-2xl font-bold">Lightning Receive</h1>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-6 space-y-4">
          <div className="flex items-center gap-3">
            {getFileIcon(new File([], metadata.originalname))}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-base">
                {metadata.originalname}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(metadata.size)}
              </p>
            </div>
          </div>

          <Button asChild className="w-full">
            <a
              href={`/api/file-download/${fileId}`}
              download={metadata.originalname}
            >
              <Download className="h-4 w-4 mr-2" />
              Download File
            </a>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          File will expire in 10 minutes
        </p>
      </div>
    </div>
  );
}
