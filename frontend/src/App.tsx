import { ThemeProvider } from "next-themes";
import { Route, BrowserRouter as Router, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import InstructionsPage from "./pages/InstructionsPage";
import ReceivePage from "./pages/ReceivePage";
import SendPage from "./pages/SendPage";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <Router>
        <div className="min-h-[100svh] bg-background text-foreground">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/instructions" element={<InstructionsPage />} />
            <Route path="/send" element={<SendPage />} />
            <Route path="/receive" element={<ReceivePage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
