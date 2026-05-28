import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import Champions from "./pages/Champions";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { useGlobalButtonHoverSound } from "./hooks/useGlobalButtonHoverSound";

function PrivateRoute({ children }) {
  const { estaLogado, carregandoAuth } = useAuth();

  if (carregandoAuth) {
    return <h1 className="loading">Carregando...</h1>;
  }

  if (!estaLogado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  const { estaLogado, usuario, sair } = useAuth();

  useGlobalButtonHoverSound();

  return (
    <BrowserRouter>
      <nav className="navbar">
        <NavLink
          to="/"
          end
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

        {!estaLogado && (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Login
            </NavLink>

            <NavLink
              to="/register"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Cadastro
            </NavLink>
          </>
        )}

        {estaLogado && (
          <div className="navbar-user">
            <span>{usuario?.name}</span>

            <button type="button" className="logout-button" onClick={sair}>
              Sair
            </button>
          </div>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/champions"
          element={
            <PrivateRoute>
              <Champions />
            </PrivateRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;