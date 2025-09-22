import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerHapticFeedback } from "@/utils/haptics";
import { ArrowRight, TextCursorInput } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

// TODO: Validate client ID format

export default function EnterCodePage() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");

  const handleBack = () => {
    triggerHapticFeedback("light");
    navigate("/");
  };

  const handleContinue = () => {
    triggerHapticFeedback("medium");
    navigate(`/receive?client-id=${clientId}`);
  };

  return (
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
              If you can't scan the QR code shown on the sending device, you can
              enter the code manually below.
            </span>
            <Input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter code"
              className="w-full font-mono"
            />
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
  );
}
