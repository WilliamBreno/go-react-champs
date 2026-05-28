import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { buscarPerfilRiot } from "../services/riotApi";

function Profile() {
  const { token, usuario } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      try {
        setCarregando(true);
        setErro("");

        const dados = await buscarPerfilRiot(token);

        setPerfil(dados);
      } catch (erro) {
        setErro(erro.message);
      } finally {
        setCarregando(false);
      }
    }

    if (token) {
      carregarPerfil();
    }
  }, [token]);

  if (carregando) {
    return <h1 className="loading">Carregando perfil...</h1>;
  }

  if (erro) {
    return <h1 className="error">{erro}</h1>;
  }

  if (!perfil) {
    return <h1 className="empty-message">Nenhum perfil Riot vinculado.</h1>;
  }

  const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${perfil.profileIconId}.png`;

  return (
    <main className="app-container">
      <h1 className="app-title">Perfil Riot</h1>

      <p className="app-subtitle">
        Informações vinculadas à sua conta de League of Legends.
      </p>

      <section className="profile-card">
        <div className="profile-icon-wrapper">
          <img
            className="profile-icon"
            src={profileIconUrl}
            alt={`Ícone de perfil de ${perfil.gameName}`}
          />
        </div>

        <div className="profile-info">
          <span className="profile-kicker">Riot ID</span>

          <h2>
            {perfil.gameName}
            <span>#{perfil.tagLine}</span>
          </h2>

          <div className="profile-grid">
            <div>
              <strong>Região</strong>
              <p>{perfil.region.toUpperCase()}</p>
            </div>

            <div>
              <strong>Nível</strong>
              <p>{perfil.summonerLevel}</p>
            </div>

            <div>
              <strong>Summoner ID</strong>
              <p>{perfil.summonerId}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Profile;