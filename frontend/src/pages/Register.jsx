import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registrarUsuario } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { entrar } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const resposta = await registrarUsuario({
        name: name.trim(),
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
        <h1 className="app-title">Criar Conta</h1>

        <p className="app-subtitle">
          Cadastre-se para salvar seus campeões e vincular sua conta Riot.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Nome:</label>
          <input
            className="input-field"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

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
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {erro && <p className="auth-error">{erro}</p>}

          <button className="primary-button" type="submit" disabled={carregando}>
            {carregando ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;