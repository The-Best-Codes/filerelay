import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, Wifi } from "lucide-react";
import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
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
              <Wifi className="h-5 w-5" />I want to...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full h-16 text-lg"
              onClick={() => navigate("/instructions?go=send")}
            >
              <Upload className="mr-2 h-6 w-6" />
              Send files
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full h-16 text-lg"
              onClick={() => navigate("/instructions?go=receive")}
            >
              <Download className="mr-2 h-6 w-6" />
              Receive files
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
