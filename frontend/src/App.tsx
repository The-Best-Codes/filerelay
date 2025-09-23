import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Route, BrowserRouter as Router, Routes } from "react-router";
import { Button } from "./components/ui/button";
import EnterCodePage from "./pages/EnterCodePage";
import HomePage from "./pages/HomePage";
import InstructionsPage from "./pages/InstructionsPage";
import ReceivePage from "./pages/ReceivePage";
import SendPage from "./pages/SendPage";
import { checkWebRTCSupport } from "./utils/webrtcUtils";

function App() {
  const [webrtcSupported, setWebrtcSupported] = useState<boolean | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const { supported } = checkWebRTCSupport();
    setWebrtcSupported(supported);
    if (!supported) {
      setShowWarning(true);
    }
  }, []);

  const handleTryAnyway = () => {
    setShowWarning(false);
  };

  if (webrtcSupported === null) {
    return (
      <div className="min-h-[100svh] bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="animate-spin size-16 mx-auto mb-4"></Loader2>
          <p className="text-muted-foreground">
            Checking browser compatibility...
          </p>
        </div>
      </div>
    );
  }

  if (showWarning) {
    return (
      <div className="min-h-[100svh] bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
            <h1 className="text-2xl font-bold">
              Browser Compatibility Warning
            </h1>
            <p className="text-muted-foreground">
              It looks like your browser doesn't fully support WebRTC, which is
              required for file sharing. The application may not work properly.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Refresh Page
            </Button>
            <Button onClick={handleTryAnyway} className="flex-1">
              Proceed Anyway
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-[100svh] bg-background text-foreground flex items-center justify-center p-4 pt-16 relative">
        <header className="absolute top-0 left-0 w-full bg-accent flex items-center justify-start p-4 h-16">
          <h1 className="text-2xl font-bold">
            <Link to="/">BCShare</Link>
          </h1>
        </header>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/instructions" element={<InstructionsPage />} />
          <Route path="/send" element={<SendPage />} />
          <Route path="/receive" element={<ReceivePage />} />
          <Route path="/enter-code" element={<EnterCodePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
