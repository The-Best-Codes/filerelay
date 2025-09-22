import { Button } from "@/components/ui/button";
import { Download, FileUp } from "lucide-react";
import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-md space-y-6">
      <h1 className="text-center font-bold text-xl">
        Choose an option below to get started
      </h1>
      <div className="p-6 pt-0 space-y-0">
        <Button
          size="lg"
          variant="outline"
          className="w-full h-16 text-lg rounded-b-none border-b border-border"
          onClick={() => navigate("/instructions?go=send")}
        >
          <FileUp className="size-6" />
          Send files
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full h-16 text-lg rounded-t-none border-t-0"
          onClick={() => navigate("/instructions?go=receive")}
        >
          <Download className="size-6" />
          Receive files
        </Button>
      </div>
    </div>
  );
}
