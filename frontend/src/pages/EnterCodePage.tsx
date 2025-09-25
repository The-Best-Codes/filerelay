import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerHapticFeedback } from "@/utils/haptics";
import { AlertCircle, ArrowRight, TextCursorInput } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function EnterCodePage() {
  if (window.devVerboseLogging)
    console.log("EnterCodePage.tsx: EnterCodePage component rendered");
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState("");

  const handleBack = () => {
    if (window.devVerboseLogging)
      console.log("EnterCodePage.tsx: User clicked Back, navigating to /");
    triggerHapticFeedback("light");
    navigate("/");
  };

  const validateClientId = (id: string): string => {
    const trimmedId = id.trim();

    if (!trimmedId) {
      return "Please enter a connection code";
    }

    if (trimmedId.length !== 6) {
      return "Connection code must be exactly 6 characters long";
    }

    // if (!/^[a-zA-Z0-9]{6}$/.test(trimmedId)) {
    //   return "Connection code must contain only letters and numbers";
    // }

    return "";
  };

  const handleContinue = () => {
    if (window.devVerboseLogging)
      console.log(
        "EnterCodePage.tsx: User clicked Continue with clientId:",
        clientId,
      );
    const validationError = validateClientId(clientId);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    triggerHapticFeedback("medium");
    navigate(`/receive?client-id=${clientId.trim()}`);
  };

  return (
    <div className="flex-1 flex justify-center items-center p-4 pt-20 overflow-auto">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg border bg-background shadow-sm p-6">
          <div className="text-center p-0 pb-4">
            <h2 className="flex items-center justify-center gap-2 text-lg font-semibold">
              <TextCursorInput className="size-6" />
              Manual Connection
            </h2>
          </div>
          <div className="space-y-6 p-0">
            <div className="space-y-2">
              <span className="text-sm block">
                If you can't scan the QR code shown on the sending device, you
                can enter the code manually below.
              </span>
              <Input
                type="text"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter code"
                className="w-full font-mono"
                maxLength={6}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-3">
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
