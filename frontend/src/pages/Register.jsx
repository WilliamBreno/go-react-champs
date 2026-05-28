import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registrarUsuario } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { entrar } = useAuth();

  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("BR1");
  const [tagLineCustom, setTagLineCustom] = useState("");
  const [region, setRegion] = useState("br1");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const tagLineFinal =
    tagLine === "OUTRA" ? tagLineCustom.trim().toUpperCase() : tagLine;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!gameName.trim()) {
      setErro("Digite seu Riot ID.");
      return;
    }

    if (!tagLineFinal) {
      setErro("Informe sua Tagline.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErro("Preencha email e senha.");
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
        gameName: gameName.trim(),
        tagLine: tagLineFinal,
        region,
        email: email.trim(),
        password,
      });

      entrar(resposta);
      navigate("/dashboard");
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
          Cadastre-se usando seu Riot ID para vincular sua conta de League of
          Legends.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Riot ID:</label>
          <input
            className="input-field"
            type="text"
            placeholder="Ex: YasuoMain"
            value={gameName}
            onChange={(event) => setGameName(event.target.value)}
          />

          <label className="field-label">Tagline:</label>
          <select
            className="select-field"
            value={tagLine}
            onChange={(event) => setTagLine(event.target.value)}
          >
            <option value="BR1">BR1</option>
            <option value="NA1">NA1</option>
            <option value="EUW">EUW</option>
            <option value="EUNE">EUNE</option>
            <option value="KR">KR</option>
            <option value="JP1">JP1</option>
            <option value="LA1">LA1</option>
            <option value="LA2">LA2</option>
            <option value="OC1">OC1</option>
            <option value="TR1">TR1</option>
            <option value="RU">RU</option>
            <option value="OUTRA">Outra</option>
          </select>

          {tagLine === "OUTRA" && (
            <input
              className="input-field"
              type="text"
              placeholder="Digite sua Tagline"
              value={tagLineCustom}
              onChange={(event) =>
                setTagLineCustom(event.target.value.toUpperCase())
              }
            />
          )}

          <p className="input-help">
            Exemplo: se seu Riot ID é <strong>YasuoMain#BR1</strong>, coloque{" "}
            <strong>YasuoMain</strong> no Riot ID e <strong>BR1</strong> na
            Tagline.
          </p>

          <label className="field-label">Região:</label>
          <select
            className="select-field"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option value="br1">Brasil - BR1</option>
            <option value="na1">América do Norte - NA1</option>
            <option value="la1">LAN - LA1</option>
            <option value="la2">LAS - LA2</option>
            <option value="euw1">Europa Oeste - EUW1</option>
            <option value="eun1">Europa Nórdica/Leste - EUN1</option>
            <option value="kr">Coreia - KR</option>
            <option value="jp1">Japão - JP1</option>
          </select>

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
            {carregando ? "Validando Riot ID..." : "Cadastrar"}
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