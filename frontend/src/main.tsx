/* eslint-disable @typescript-eslint/no-explicit-any */
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import "./index.css";

// Global verbose logging toggle
declare global {
  var devVerboseLogging: boolean;
  function dev_enableVerboseLogging(): void;
}

(window as any).dev_enableVerboseLogging = () => {
  (window as any).devVerboseLogging = true;
  console.log(
    "SUPER VERBOSE LOGGING ENABLED: All logs will now be extremely detailed",
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
