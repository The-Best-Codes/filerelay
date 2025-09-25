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
  if (window.devVerboseLogging)
    console.log(
      "App.tsx: App component initialized with initial state: webrtcSupported=null, webrtcDetails=[], showWarning=false",
    );
  const [webrtcSupported, setWebrtcSupported] = useState<boolean | null>(null);
  const [webrtcDetails, setWebrtcDetails] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (window.devVerboseLogging)
      console.log("App.tsx: useEffect triggered to check WebRTC support");
    const { supported, details } = checkWebRTCSupport();
    if (window.devVerboseLogging)
      console.log("App.tsx: WebRTC support check result:", {
        supported,
        details,
      });
    setWebrtcSupported(supported);
    setWebrtcDetails(details);
    if (!supported) {
      if (window.devVerboseLogging)
        console.log(
          "App.tsx: WebRTC not supported, setting showWarning to true",
        );
      setShowWarning(true);
    }
  }, []);

  const handleTryAnyway = () => {
    if (window.devVerboseLogging)
      console.log('App.tsx: User clicked "Proceed Anyway", hiding warning');
    setShowWarning(false);
  };

  if (webrtcSupported === null) {
    if (window.devVerboseLogging)
      console.log(
        "App.tsx: Rendering loading state while checking WebRTC support",
      );
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
    if (window.devVerboseLogging)
      console.log(
        "App.tsx: Rendering WebRTC compatibility warning with details:",
        webrtcDetails,
      );
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
            <p className="text-muted-foreground text-left text-sm">
              These are the indications we detected that your browser may not
              support WebRTC:
            </p>
            <ul className="text-left text-muted-foreground text-sm list-disc list-inside">
              {webrtcDetails.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (window.devVerboseLogging)
                  console.log('App.tsx: User clicked "Refresh Page"');
                window.location.reload();
              }}
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

  if (window.devVerboseLogging)
    console.log("App.tsx: Rendering main app with Router and routes");
  return (
    <Router>
      <div className="min-h-[100svh] bg-background text-foreground flex flex-col relative">
        <header className="absolute top-0 left-0 w-full bg-accent flex items-center justify-start p-4 h-16 z-10">
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
