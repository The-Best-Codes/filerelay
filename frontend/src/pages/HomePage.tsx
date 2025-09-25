import { Button } from "@/components/ui/button";
import { FileUp, TextCursorInput } from "lucide-react";
import { useNavigate } from "react-router";

export default function HomePage() {
  if (window.devVerboseLogging)
    console.log(
      "HomePage.tsx: HomePage component rendered, user can choose to send files or enter code",
    );
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex justify-center items-center p-4 pt-20 overflow-auto">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-center font-bold text-xl">I want to...</h1>
        <div className="p-6 pt-0 space-y-0">
          <Button
            size="lg"
            variant="outline"
            className="w-full h-16 text-base sm:text-lg rounded-b-none border-b border-border"
            onClick={() => {
              if (window.devVerboseLogging)
                console.log(
                  'HomePage.tsx: User clicked "Send Files", navigating to /instructions?go=send',
                );
              navigate("/instructions?go=send");
            }}
          >
            <FileUp className="size-4 sm:size-6" />
            Send Files from This Device
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full h-16 text-base sm:text-lg rounded-t-none border-t-0"
            onClick={() => {
              if (window.devVerboseLogging)
                console.log(
                  'HomePage.tsx: User clicked "Enter Code", navigating to /instructions?go=enter-code',
                );
              navigate("/instructions?go=enter-code");
            }}
          >
            <TextCursorInput className="size-4 sm:size-6" />
            Enter a Connection Code
          </Button>
        </div>
      </div>
    </div>
  );
}
