import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import InstructionsPage from "./pages/InstructionsPage";
import SendPage from "./pages/SendPage";
import ReceivePage from "./pages/ReceivePage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/instructions" element={<InstructionsPage />} />
          <Route path="/send" element={<SendPage />} />
          <Route path="/receive" element={<ReceivePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
