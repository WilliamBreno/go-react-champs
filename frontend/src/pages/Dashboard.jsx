import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { buscarPerfilRiot } from "../services/riotApi";
import { listarChampions } from "../services/api";

function Dashboard() {
  const { usuario, token } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [champions, setChampions] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setCarregando(true);
        setErro("");

        const [perfilRiot, respostaChampions] = await Promise.all([
          buscarPerfilRiot(token),
          listarChampions(token, "", "recentes", 1, 5),
        ]);

        setPerfil(perfilRiot);
        setChampions(respostaChampions.dados || []);
      } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);
        setErro(erro.message || "Erro ao carregar dashboard.");
      } finally {
        setCarregando(false);
      }
    }

    if (token) {
      carregarDashboard();
    }
  }, [token]);

  if (carregando) {
    return <h1 className="loading">Carregando dashboard...</h1>;
  }

  if (erro) {
    return <h1 className="error">{erro}</h1>;
  }

  const totalChampions = champions.length;

  const maiorMaestria = champions.reduce((maior, champion) => {
    return champion.maestria > maior ? champion.maestria : maior;
  }, 0);

  const ultimoChampion = champions[0];

  const estaEmPartida = perfil?.liveStatus?.isInGame;

  return (
    <main className="app-container">
      <section className="dashboard-hero">
        <span className="dashboard-kicker">Dashboard</span>

        <h1>
          Olá, <strong>{usuario?.name}</strong>
        </h1>

        <p>
          Acompanhe seu perfil Riot, seus campeões cadastrados e o status da sua
          conta em um só lugar.
        </p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-profile-card">
          <span className="dashboard-card-label">Perfil Riot</span>

          <h2>
            {perfil?.gameName}
            <small>#{perfil?.tagLine}</small>
          </h2>

          <p>Região: {perfil?.region?.toUpperCase()}</p>
          <p>Nível: {perfil?.summonerLevel}</p>

          <Link className="dashboard-link-button" to="/perfil">
            Ver perfil
          </Link>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-label">Champions</span>

          <h2>{totalChampions}</h2>

          <p>Campeões cadastrados nesta página.</p>

          {ultimoChampion ? (
            <small>Último: {ultimoChampion.nome}</small>
          ) : (
            <small>Nenhum campeão cadastrado ainda.</small>
          )}

          <Link className="dashboard-link-button" to="/champions">
            Ver champions
          </Link>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-label">Maior maestria</span>

          <h2>
            {maiorMaestria > 0
              ? new Intl.NumberFormat("pt-BR").format(maiorMaestria)
              : "0"}
          </h2>

          <p>Maior valor entre os campeões cadastrados.</p>

          <Link className="dashboard-link-button" to="/champions">
            Gerenciar
          </Link>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-label">Status no LoL</span>

          <div className="dashboard-status-row">
            <div
              className={
                estaEmPartida
                  ? "dashboard-status-dot online"
                  : "dashboard-status-dot"
              }
            />

            <h2>{estaEmPartida ? "Em partida" : "Fora de partida"}</h2>
          </div>

          <p>
            {estaEmPartida
              ? "A Riot API encontrou uma partida ativa."
              : "Nenhuma partida ativa encontrada agora."}
          </p>

          <Link className="dashboard-link-button" to="/perfil">
            Ver status
          </Link>
        </article>
      </section>

      <section className="dashboard-actions">
        <h2>Ações rápidas</h2>

        <div>
          <Link className="primary-button dashboard-action-link" to="/champions">
            Ver Champions
          </Link>

          <Link className="card-button dashboard-action-link" to="/perfil">
            Ver Perfil Riot
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;