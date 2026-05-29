import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

import {
  aceitarSolicitacao,
  buscarUsuarios,
  enviarSolicitacaoAmizade,
  listarAmigos,
  listarSolicitacoes,
  recusarSolicitacao,
  removerAmigo,
} from "../services/friendApi";

function Friends() {
  const { token } = useAuth();

  const [busca, setBusca] = useState("");
  const [usuariosEncontrados, setUsuariosEncontrados] = useState([]);

  const [amigos, setAmigos] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [buscando, setBuscando] = useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarDados() {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const [listaAmigos, listaSolicitacoes] = await Promise.all([
        listarAmigos(token),
        listarSolicitacoes(token),
      ]);

      setAmigos(listaAmigos || []);
      setSolicitacoes(listaSolicitacoes || []);
    } catch (erro) {
      console.error("Erro ao carregar amigos:", erro);
      setErro(erro.message || "Erro ao carregar amigos.");
    } finally {
      setCarregando(false);
    }
  }

  async function pesquisarUsuarios(event) {
    event.preventDefault();

    if (!busca.trim()) {
      setUsuariosEncontrados([]);
      return;
    }

    try {
      setBuscando(true);
      setErro("");
      setMensagem("");

      const usuarios = await buscarUsuarios(token, busca);

      setUsuariosEncontrados(usuarios || []);
    } catch (erro) {
      console.error("Erro ao buscar usuários:", erro);
      setErro(erro.message || "Erro ao buscar usuários.");
    } finally {
      setBuscando(false);
    }
  }

  async function enviarSolicitacao(usuario) {
    try {
      setErro("");
      setMensagem("");

      await enviarSolicitacaoAmizade(token, usuario.id);

      setMensagem(`Solicitação enviada para ${usuario.name}.`);
      setUsuariosEncontrados((usuariosAtuais) =>
        usuariosAtuais.filter((item) => item.id !== usuario.id)
      );

      await carregarDados();
    } catch (erro) {
      console.error("Erro ao enviar solicitação:", erro);
      setErro(erro.message || "Erro ao enviar solicitação.");
    }
  }

  async function aceitarPedido(solicitacao) {
    try {
      setErro("");
      setMensagem("");

      await aceitarSolicitacao(token, solicitacao.id);

      setMensagem(`Você aceitou ${solicitacao.user.name}.`);

      await carregarDados();
    } catch (erro) {
      console.error("Erro ao aceitar solicitação:", erro);
      setErro(erro.message || "Erro ao aceitar solicitação.");
    }
  }

  async function recusarPedido(solicitacao) {
    try {
      setErro("");
      setMensagem("");

      await recusarSolicitacao(token, solicitacao.id);

      setMensagem(`Solicitação de ${solicitacao.user.name} recusada.`);

      await carregarDados();
    } catch (erro) {
      console.error("Erro ao recusar solicitação:", erro);
      setErro(erro.message || "Erro ao recusar solicitação.");
    }
  }

  async function remover(friendship) {
    const confirmar = confirm(
      `Tem certeza que deseja remover ${friendship.user.name} dos amigos?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");
      setMensagem("");

      await removerAmigo(token, friendship.id);

      setMensagem(`${friendship.user.name} foi removido dos amigos.`);

      await carregarDados();
    } catch (erro) {
      console.error("Erro ao remover amigo:", erro);
      setErro(erro.message || "Erro ao remover amigo.");
    }
  }

  useEffect(() => {
    carregarDados();
  }, [token]);

  if (carregando) {
    return <h1 className="loading">Carregando amigos...</h1>;
  }

  return (
    <main className="app-container">
      <h1 className="app-title">Amigos</h1>

      <p className="app-subtitle">
        Encontre usuários do app, envie solicitações e gerencie sua lista de
        amigos.
      </p>

      {erro && <p className="friends-message error-message">{erro}</p>}

      {mensagem && <p className="friends-message success-message">{mensagem}</p>}

      <section className="friends-panel">
        <h2>Buscar usuários</h2>

        <form onSubmit={pesquisarUsuarios} className="friends-search-form">
          <input
            className="input-field"
            type="text"
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />

          <button className="primary-button" type="submit" disabled={buscando}>
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {usuariosEncontrados.length > 0 && (
          <div className="friends-list">
            {usuariosEncontrados.map((usuario) => (
              <article key={usuario.id} className="friend-card">
                <div>
                  <strong>{usuario.name}</strong>
                  <small>{usuario.isOnline ? "Online agora" : `Visto por último: ${usuario.lastSeenAt || "indisponível"}`}</small>
                  <div className="friend-card-status">
                    <span
                      className={
                        usuario.isOnline ? "chat-status-dot online" : "chat-status-dot"
                      }
                    />

                    <small
                      className={
                        usuario.isOnline ? "friend-status-text online" : "friend-status-text"
                      }
                    >
                      {usuario.isOnline
                        ? "Online agora"
                        : `Visto por último: ${usuario.lastSeenAt || "indisponível"}`}
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  className="card-button"
                  onClick={() => enviarSolicitacao(usuario)}
                >
                  Adicionar
                </button>
              </article>
            ))}
          </div>
        )}

        {busca.trim() && usuariosEncontrados.length === 0 && !buscando && (
          <p className="empty-message">Nenhum usuário encontrado.</p>
        )}
      </section>

      <section className="friends-grid">
        <div className="friends-panel">
          <h2>Solicitações recebidas</h2>

          {solicitacoes.length === 0 ? (
            <p className="empty-message">Nenhuma solicitação pendente.</p>
          ) : (
            <div className="friends-list">
              {solicitacoes.map((solicitacao) => (
                <article key={solicitacao.id} className="friend-card">
                  <div>
                    <strong>{solicitacao.user.name}</strong>
                    <small>{solicitacao.user.isOnline
                              ? "Online agora"
                              : `Visto por último: ${solicitacao.user.lastSeenAt || "indisponível"}`}</small>
                    <div className="friend-card-status">
                      <span
                        className={
                          solicitacao.user.isOnline ? "chat-status-dot online" : "chat-status-dot"
                        }
                      />

                      <small
                        className={
                          solicitacao.user.isOnline
                            ? "friend-status-text online"
                            : "friend-status-text"
                        }
                      >
                        {solicitacao.user.isOnline
                          ? "Online agora"
                          : `Visto por último: ${
                              solicitacao.user.lastSeenAt || "indisponível"
                            }`}
                      </small>
                    </div>
                  </div>

                  <div className="friend-card-actions">
                    <button
                      type="button"
                      className="card-button"
                      onClick={() => aceitarPedido(solicitacao)}
                    >
                      Aceitar
                    </button>

                    <button
                      type="button"
                      className="card-button danger"
                      onClick={() => recusarPedido(solicitacao)}
                    >
                      Recusar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="friends-panel">
          <h2>Meus amigos</h2>

          {amigos.length === 0 ? (
            <p className="empty-message">Você ainda não tem amigos.</p>
          ) : (
            <div className="friends-list">
              {amigos.map((amigo) => (
                <article key={amigo.id} className="friend-card">
                  <div>
                    <strong>{amigo.user.name}</strong>
                    <small>{amigo.user.isOnline
                      ? "Online agora"
                      : `Visto por último: ${amigo.user.lastSeenAt || "indisponível"}`}</small>
                    <div className="friend-card-status">
                      <span
                        className={
                          amigo.user.isOnline ? "chat-status-dot online" : "chat-status-dot"
                        }
                      />

                      <small
                        className={
                          amigo.user.isOnline ? "friend-status-text online" : "friend-status-text"
                        }
                      >
                        {amigo.user.isOnline
                          ? "Online agora"
                          : `Visto por último: ${amigo.user.lastSeenAt || "indisponível"}`}
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="card-button danger"
                    onClick={() => remover(amigo)}
                  >
                    Remover
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Friends;