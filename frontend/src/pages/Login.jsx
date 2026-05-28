import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUsuario } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { entrar } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErro("Preencha email e senha.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const resposta = await loginUsuario({
        email: email.trim(),
        password,
      });

      entrar(resposta);
      navigate("/champions");
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="app-title">Entrar</h1>

        <p className="app-subtitle">
          Acesse sua conta para gerenciar seus campeões.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Email:</label>
          <input
            className="input-field"
            type="email"
            placeholder="seuemail@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="field-label">Senha:</label>
          <input
            className="input-field"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {erro && <p className="auth-error">{erro}</p>}

          <button className="primary-button" type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-footer">
          Ainda não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;