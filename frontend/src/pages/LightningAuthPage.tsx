import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowRight, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function LightningAuthPage() {
  if (window.devVerboseLogging)
    console.log(
      "LightningAuthPage.tsx: LightningAuthPage component initialized",
    );
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCode = async (providedCode: string) => {
    if (window.devVerboseLogging)
      console.log(
        "LightningAuthPage.tsx: Validating code:",
        providedCode ? "***" : "none",
      );
    try {
      setIsValidating(true);
      setError(null);
      const response = await fetch("/api/lightning-validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: providedCode }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          sessionStorage.setItem("lightning_code", providedCode);
          navigate("/lightning-send");
        } else {
          setError("Invalid access code");
        }
      } else {
        throw new Error("Invalid access code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (window.devVerboseLogging)
      console.log(
        "LightningAuthPage.tsx: useEffect checking sessionStorage for lightning_code",
      );
    const storedCode = sessionStorage.getItem("lightning_code");
    if (storedCode) {
      validateCode(storedCode).then((valid) => {
        if (valid) {
          sessionStorage.setItem("lightning_code", storedCode);
          navigate("/lightning-send");
        } else {
          sessionStorage.removeItem("lightning_code");
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleContinue = async () => {
    if (window.devVerboseLogging)
      console.log(
        "LightningAuthPage.tsx: User clicked Continue with code:",
        code ? "***" : "none",
      );
    if (!code.trim()) {
      setError("Please enter an access code");
      return;
    }
    const valid = await validateCode(code.trim());
    if (valid) {
      sessionStorage.setItem("lightning_code", code.trim());
      navigate("/lightning-send");
    } else {
      setError("Invalid access code");
    }
  };

  const handleBack = () => {
    if (window.devVerboseLogging)
      console.log("LightningAuthPage.tsx: User clicked Back, navigating to /");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center p-4 pt-20 overflow-auto">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Validating access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex justify-center items-center p-4 pt-20 overflow-auto">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg border bg-background shadow-sm p-6">
          <div className="text-center p-0 pb-4">
            <h2 className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Lock className="size-6" />
              Enter Access Code
            </h2>
          </div>
          <div className="space-y-6 p-0">
            <div className="space-y-2">
              <span className="text-sm block text-muted-foreground">
                Provide the access code to enable Lightning File Transfer. If
                you don't have one, you can request one from the FileRelay team.
              </span>
              <Input
                type="password"
                placeholder="Access code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleContinue();
                  }
                }}
                disabled={isValidating}
                className="text-lg font-mono"
                autoFocus
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
              <Button
                onClick={handleContinue}
                className="flex-1"
                size="sm"
                disabled={isValidating || !code.trim()}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
