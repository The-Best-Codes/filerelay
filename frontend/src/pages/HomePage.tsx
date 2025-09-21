import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wifi className="size-5" />I want to...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full h-16 text-lg"
              onClick={() => navigate("/instructions?go=send")}
            >
              <FileUp className="size-6" />
              Send files
            </Button>

            <Button
              size="lg"
              className="w-full h-16 text-lg"
              onClick={() => navigate("/instructions?go=receive")}
            >
              <Download className="size-6" />
              Receive files
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
