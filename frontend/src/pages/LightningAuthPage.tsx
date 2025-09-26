import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowLeft, Loader2, Lock } from "lucide-react";
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
  const [isValid, setIsValid] = useState(false);

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
        return true;
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
          setIsValid(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter an access code");
      return;
    }
    const valid = await validateCode(code.trim());
    if (valid) {
      sessionStorage.setItem("lightning_code", code.trim());
      setIsValid(true);
      navigate("/lightning-send");
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

  if (isValid) {
    return (
      <div className="flex-1 flex justify-center items-center p-4 pt-20 overflow-auto">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">
            Access granted, redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex justify-center items-start p-4 pt-20 overflow-auto">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Lightning File Transfer</h1>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-6 space-y-4">
          <div className="text-center space-y-2">
            <Lock className="h-8 w-8 mx-auto text-primary" />
            <h2 className="text-lg font-semibold">Enter Access Code</h2>
            <p className="text-sm text-muted-foreground">
              Provide the access code to enable Lightning File Transfer. If you
              don't have one, you can request one from the FileRelay team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Access code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isValidating}
              className="text-lg"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isValidating || !code.trim()}
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
