import { Button } from "@/components/ui/button";
import { triggerHapticFeedback } from "@/utils/haptics";
import { ArrowRight, Wifi } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

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
    <div className="flex min-h-[100svh] items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-md space-y-4 md:space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
        </div>

        <div className="rounded-lg border bg-background shadow-sm p-3 md:p-6">
          <div className="text-center p-0 pb-3 md:pb-4">
            <h2 className="flex items-center justify-center gap-2 text-base md:text-lg font-semibold">
              <Wifi className="h-5 w-5 md:h-6 md:w-6" />
              WiFi Connection Required
            </h2>
          </div>
          <div className="space-y-4 md:space-y-6 p-0">
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

              <ul className="list-disc pl-5 space-y-2 md:space-y-3 text-xs md:text-sm text-muted-foreground">
                <li>Both devices must be on the same WiFi network</li>
                <li>
                  Files are shared directly between devices (no uploads to
                  cloud)
                </li>
                <li>Keep both devices active during the transfer</li>
              </ul>
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
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
