import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";

export default function InstructionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get("go");

  const isSending = action === "send";
  const title = isSending ? "Send Files" : "Receive Files";
  const nextRoute = isSending ? "/send" : "/receive";

  const handleBack = () => {
    triggerHapticFeedback("light");
    navigate("/");
  };

  const handleContinue = () => {
    triggerHapticFeedback("medium");
    navigate(nextRoute);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-md space-y-4 md:space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
        </div>

        <Card className="p-3 md:p-6">
          <CardHeader className="text-center p-0 pb-3 md:pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-base md:text-lg">
              <Wifi className="h-5 w-5 md:h-6 md:w-6" />
              WiFi Connection Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 p-0">
            <div className="space-y-3 md:space-y-4">
              <div className="bg-primary/5 p-3 md:p-4 rounded-lg border border-primary/10">
                <p className="text-xs md:text-sm font-medium mb-2">
                  Important:
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Make sure both devices are connected to the same WiFi network
                  before continuing.
                </p>
              </div>

              <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-secondary rounded-full flex items-center justify-center font-medium text-xs flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Both devices must be on the same WiFi network</p>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-secondary rounded-full flex items-center justify-center font-medium text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Files are shared directly between devices (no uploads to
                    cloud)
                  </p>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-secondary rounded-full flex items-center justify-center font-medium text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Keep both devices active during the transfer</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 md:gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                size="sm"
              >
                Back
              </Button>
              <Button onClick={handleContinue} className="flex-1" size="sm">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
