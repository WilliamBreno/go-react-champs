import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { buscarPerfilRiot } from "../services/riotApi";

function RankedCard({ rank, queueType }) {
  function formatarNomeFila(queueType) {
    if (queueType === "RANKED_SOLO_5x5") {
      return "Solo/Duo";
    }

    if (queueType === "RANKED_FLEX_SR") {
      return "Flex";
    }

    return "Ranqueada";
  }

  function getRankIcon(rank) {
    if (!rank || !rank.tier) {
      return "/ranks/unranked.png";
    }

    return `/ranks/${rank.tier.toLowerCase()}.png`;
  }

  function formatarRank(rank) {
    if (!rank) {
      return "Sem rank";
    }

    return `${rank.tier} ${rank.rank}`;
  }

  return (
    <article className="ranked-card">
      <img
        className="ranked-icon"
        src={getRankIcon(rank)}
        alt={rank ? `Ícone ${rank.tier}` : "Sem rank"}
      />

      <div className="ranked-info">
        <span>{formatarNomeFila(queueType)}</span>

        <h3>{formatarRank(rank)}</h3>

        {rank ? (
          <>
            <p>{rank.leaguePoints} PDL</p>

            <small>
              {rank.wins}V / {rank.losses}D
            </small>
          </>
        ) : (
          <>
            <p>Sem partidas ranqueadas</p>
            <small>Nenhum elo encontrado</small>
          </>
        )}
      </div>
    </article>
  );
}

function StatusCard({ liveStatus }) {
  const estaEmPartida = liveStatus?.isInGame;

  function formatarFila(queueId) {
    const filas = {
      420: "Ranqueada Solo/Duo",
      440: "Ranqueada Flex",
      400: "Normal Draft",
      430: "Normal Blind",
      450: "ARAM",
      700: "Clash",
      900: "URF",
      1700: "Arena",
    };

    return filas[queueId] || `Fila ${queueId}`;
  }

  return (
    <section className="status-section">
      <h2 className="section-title">Status</h2>

      <div className="status-card">
        <div className={estaEmPartida ? "status-dot online" : "status-dot"} />

        <div className="status-info">
          <span>Status no LoL</span>

          <h3>{estaEmPartida ? "Em partida agora" : "Fora de partida"}</h3>

          {estaEmPartida ? (
            <>
              <p>{formatarFila(liveStatus.gameQueueConfigId)}</p>

              <small>
                Modo: {liveStatus.gameMode || "Indefinido"} · Tipo:{" "}
                {liveStatus.gameType || "Indefinido"}
              </small>
            </>
          ) : (
            <>
              <p>Nenhuma partida ativa encontrada.</p>
              <small>O jogador pode estar offline ou fora de jogo.</small>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Profile() {
  const { token } = useAuth();

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
        setErro(erro.message || "Erro ao carregar perfil Riot.");
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

  const soloDuo = perfil.ranked?.find(
    (rank) => rank.queueType === "RANKED_SOLO_5x5"
  );

  const flex = perfil.ranked?.find(
    (rank) => rank.queueType === "RANKED_FLEX_SR"
  );

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
              <p>{perfil.region?.toUpperCase()}</p>
            </div>

            <div>
              <strong>Nível</strong>
              <p>{perfil.summonerLevel}</p>
            </div>

            <div>
              <strong>Conta vinculada</strong>
              <p>Ativa</p>
            </div>
          </div>
        </div>
      </section>

      <StatusCard liveStatus={perfil.liveStatus} />

      <section className="ranked-section">
        <h2 className="section-title">Ranqueadas</h2>

        <div className="ranked-grid">
          <RankedCard rank={soloDuo} queueType="RANKED_SOLO_5x5" />
          <RankedCard rank={flex} queueType="RANKED_FLEX_SR" />
        </div>
      </section>
    </main>
  );
}

export default Profile;