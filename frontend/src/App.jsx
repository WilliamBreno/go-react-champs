import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import Champions from "./pages/Champions";

import { useGlobalButtonHoverSound } from "./hooks/useGlobalButtonHoverSound";

function App() {
  useGlobalButtonHoverSound();

  return (
    <BrowserRouter>
      <nav className="navbar">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-link nav-link-active" : "nav-link"
          }
        >
          Início
        </NavLink>

        <NavLink
          to="/champions"
          className={({ isActive }) =>
            isActive ? "nav-link nav-link-active" : "nav-link"
          }
        >
          Champions
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/champions" element={<Champions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;