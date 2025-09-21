import { Button } from "@/components/ui/button";
import { Download, FileUp, Wifi } from "lucide-react";
import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[100svh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">BCShare</h1>
          <p className="text-muted-foreground">
            Share files instantly between devices
          </p>
        </div>

        <div className="rounded-lg border bg-background shadow-sm">
          <div className="text-center pt-6 pb-4">
            <h2 className="flex items-center justify-center gap-2 text-xl font-semibold">
              <Wifi className="size-5" />I want to...
            </h2>
          </div>
          <div className="p-6 pt-0 space-y-0">
            <Button
              size="lg"
              className="w-full h-16 text-lg rounded-b-none border-b border-border"
              onClick={() => navigate("/instructions?go=send")}
            >
              <FileUp className="size-6" />
              Send files
            </Button>
            <Button
              size="lg"
              className="w-full h-16 text-lg rounded-t-none"
              onClick={() => navigate("/instructions?go=receive")}
            >
              <Download className="size-6" />
              Receive files
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
