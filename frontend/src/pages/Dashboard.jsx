import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { buscarPerfilRiot } from "../services/riotApi";
import { listarChampions } from "../services/api";

function Dashboard() {
  const { usuario, token } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [pool, setPool] = useState([]);
  const [totalPool, setTotalPool] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setCarregando(true);
        setErro("");

        const [perfilRiot, respostaPool] = await Promise.all([
          buscarPerfilRiot(token),
          listarChampions({
            token,
            nome: "",
            lane: "Todos",
            status: "Todos",
            ordem: "recentes",
            page: 1,
            limit: 5,
          }),
        ]);

        setPerfil(perfilRiot);
        setPool(respostaPool.dados || []);
        setTotalPool(respostaPool.total || 0);
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

  const estaEmPartida = perfil?.liveStatus?.isInGame;

  const totalMain = pool.filter((champion) => champion.prioridade === "Main")
    .length;

  const totalTreinando = pool.filter(
    (champion) => champion.status === "Treinando"
  ).length;

  const ultimoChampion = pool[0];

  return (
    <main className="app-container">
      <section className="dashboard-hero">
        <span className="dashboard-kicker">Dashboard</span>

        <h1>
          Olá, <strong>{usuario?.name}</strong>
        </h1>

        <p>
          Acompanhe seu perfil Riot, seu pool de campeões, status no LoL e
          atalhos rápidos em um só lugar.
        </p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-profile-card">
          <span className="dashboard-card-label">Perfil Riot</span>

          <h2>
            {perfil?.gameName || "Conta Riot"}
            {perfil?.tagLine && <small>#{perfil.tagLine}</small>}
          </h2>

          <p>Região: {perfil?.region?.toUpperCase() || "Indefinida"}</p>
          <p>Nível: {perfil?.summonerLevel || "Não encontrado"}</p>

          <Link className="dashboard-link-button" to="/perfil">
            Ver perfil
          </Link>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-label">Meu Pool</span>

          <h2>{totalPool}</h2>

          <p>Campeões adicionados ao seu pool pessoal.</p>

          {ultimoChampion ? (
            <small>
              Último: {ultimoChampion.nome} — {ultimoChampion.lane}
            </small>
          ) : (
            <small>Nenhum campeão no pool ainda.</small>
          )}

          <Link className="dashboard-link-button" to="/champions">
            Ver pool
          </Link>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-label">Prioridade</span>

          <h2>{totalMain}</h2>

          <p>Campeões marcados como Main no seu pool.</p>

          <small>
            {totalTreinando} campeão{totalTreinando === 1 ? "" : "es"} em
            treinamento.
          </small>

          <Link className="dashboard-link-button" to="/champions">
            Gerenciar pool
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
            Meu Pool
          </Link>

          <Link className="card-button dashboard-action-link" to="/perfil">
            Perfil Riot
          </Link>

          <Link className="card-button dashboard-action-link" to="/friends">
            Amigos
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;