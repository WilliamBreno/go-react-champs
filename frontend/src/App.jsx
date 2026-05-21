import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import Champions from "./pages/Champions";

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/">Início</Link>
        <Link to="/champions">Champions</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/champions" element={<Champions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;