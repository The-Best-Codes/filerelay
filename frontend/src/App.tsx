import { ThemeProvider } from "next-themes";
import { Link, Route, BrowserRouter as Router, Routes } from "react-router";
import EnterCodePage from "./pages/EnterCodePage";
import HomePage from "./pages/HomePage";
import InstructionsPage from "./pages/InstructionsPage";
import ReceivePage from "./pages/ReceivePage";
import SendPage from "./pages/SendPage";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
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
    </ThemeProvider>
  );
}

export default App;
