import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";

import "./App.css";

import Home from "./pages/Home";
import Champions from "./pages/Champions";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";

import Friends from "./pages/Friends";

import ChatSidebar from "./components/ChatSidebar";

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
        <div className="navbar-links">
          {!estaLogado && (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Início
            </NavLink>
          )}

          {estaLogado && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/champions"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                Champions
              </NavLink>

              <NavLink
                to="/perfil"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                Perfil
              </NavLink>

              <NavLink
                to="/friends"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                Amigos
              </NavLink>
            </>
          )}

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
        </div>

        {estaLogado && (
          <div className="navbar-user">
            <span>{usuario?.name}</span>

            <button type="button" className="logout-button" onClick={sair}>
              Sair
            </button>
          </div>
        )}
      </nav>
      
      {estaLogado && <ChatSidebar />}  

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/champions"
          element={
            <PrivateRoute>
              <Champions />
            </PrivateRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <PrivateRoute>
              <Friends />
            </PrivateRoute>
          }
        />
        <Route
          path="/login"
          element={
            estaLogado ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        <Route
          path="/register"
          element={
            estaLogado ? <Navigate to="/dashboard" replace /> : <Register />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
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