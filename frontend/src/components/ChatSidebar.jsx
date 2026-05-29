import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { listarAmigos } from "../services/friendApi";
import { enviarMensagem, listarMensagens } from "../services/chatApi";
import { atualizarStatusOnline } from "../services/userApi";
import {
  notificarNovaMensagem,
  piscarTituloDaPagina,
  solicitarPermissaoNotificacao,
  tocarSomNotificacao,
} from "../utils/notificationUtils";

function ChatSidebar() {
  const { token, usuario } = useAuth();

  const [aberto, setAberto] = useState(false);
  const [amigos, setAmigos] = useState([]);
  const [amigoSelecionado, setAmigoSelecionado] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");

  const [erro, setErro] = useState("");
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);

  const [permissaoNotificacao, setPermissaoNotificacao] = useState(
    "Notification" in window ? Notification.permission : "unsupported"
  );

  const [totalNovasMensagens, setTotalNovasMensagens] = useState(0);
  const [ultimaMensagemPorAmizade, setUltimaMensagemPorAmizade] = useState({});

  const mensagensFinalRef = useRef(null);
  const primeiraVerificacaoRef = useRef(true);

  async function ativarNotificacoes() {
    const permissao = await solicitarPermissaoNotificacao();

    setPermissaoNotificacao(permissao);

    if (permissao === "granted") {
      setErro("");
    } else if (permissao === "denied") {
      setErro("As notificações foram bloqueadas no navegador.");
    }
  }

  async function carregarAmigos() {
    if (!token) {
      return [];
    }

    try {
      const dados = await listarAmigos(token);
      const lista = dados || [];

      setAmigos(lista);

      return lista;
    } catch (erro) {
      console.error("Erro ao carregar amigos do chat:", erro);
      setErro("Erro ao carregar amigos.");
      return [];
    }
  }

  function dispararNotificacao(amigo, mensagem) {
    const nomeRemetente =
      amigo?.user?.name || mensagem.sender?.name || "Nova mensagem";

    setTotalNovasMensagens((total) => total + 1);

    notificarNovaMensagem({
      titulo: `Mensagem de ${nomeRemetente}`,
      corpo: mensagem.content,
    });

    tocarSomNotificacao();
    piscarTituloDaPagina(`Mensagem de ${nomeRemetente}`);
  }

  async function carregarMensagens(friendshipId, amigo = amigoSelecionado) {
    if (!token || !friendshipId) {
      return;
    }

    try {
      setCarregandoMensagens(true);

      const dados = await listarMensagens(token, friendshipId);
      const mensagensRecebidas = dados || [];

      setMensagens(mensagensRecebidas);

      const ultimaMensagem = mensagensRecebidas[mensagensRecebidas.length - 1];

      if (ultimaMensagem) {
        setUltimaMensagemPorAmizade((estadoAtual) => ({
          ...estadoAtual,
          [friendshipId]: ultimaMensagem.id,
        }));
      }
    } catch (erro) {
      console.error("Erro ao carregar mensagens:", erro);
      setErro("Erro ao carregar mensagens.");
    } finally {
      setCarregandoMensagens(false);
    }
  }

  async function verificarNovasMensagens(listaAmigos = amigos) {
    if (!token || listaAmigos.length === 0) {
      return;
    }

    const novoMapa = {};

    for (const amigo of listaAmigos) {
      try {
        const mensagensDaConversa = await listarMensagens(token, amigo.id);
        const ultimaMensagem =
          mensagensDaConversa?.[mensagensDaConversa.length - 1];

        if (!ultimaMensagem) {
          continue;
        }

        novoMapa[amigo.id] = ultimaMensagem.id;

        const ultimoIdAnterior = ultimaMensagemPorAmizade[amigo.id];

        const temMensagemNova =
          !primeiraVerificacaoRef.current &&
          ultimoIdAnterior &&
          ultimaMensagem.id !== ultimoIdAnterior &&
          ultimaMensagem.senderId !== usuario?.id;

        if (temMensagemNova) {
          dispararNotificacao(amigo, ultimaMensagem);

          if (amigoSelecionado?.id === amigo.id) {
            setMensagens(mensagensDaConversa || []);
          }
        }
      } catch (erro) {
        console.error("Erro ao verificar mensagens:", erro);
      }
    }

    setUltimaMensagemPorAmizade((estadoAtual) => ({
      ...estadoAtual,
      ...novoMapa,
    }));

    primeiraVerificacaoRef.current = false;
  }

  async function selecionarAmigo(amigo) {
    setAmigoSelecionado(amigo);
    setErro("");
    setTotalNovasMensagens(0);

    await carregarMensagens(amigo.id, amigo);
  }

  async function handleEnviarMensagem(event) {
    event.preventDefault();

    if (!texto.trim() || !amigoSelecionado) {
      return;
    }

    try {
      await enviarMensagem(token, amigoSelecionado.id, texto.trim());

      setTexto("");

      await carregarMensagens(amigoSelecionado.id, amigoSelecionado);
    } catch (erro) {
      console.error("Erro ao enviar mensagem:", erro);
      setErro("Erro ao enviar mensagem.");
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    async function enviarPing() {
      try {
        await atualizarStatusOnline(token);
      } catch (erro) {
        console.error("Erro ao atualizar status online:", erro);
      }
    }

    enviarPing();

    const intervalo = setInterval(() => {
      enviarPing();
    }, 30000);

    return () => clearInterval(intervalo);
  }, [token]);

  useEffect(() => {
    async function iniciarChat() {
      const lista = await carregarAmigos();

      if (lista.length > 0) {
        await verificarNovasMensagens(lista);
      }
    }

    iniciarChat();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const intervalo = setInterval(async () => {
      let listaAtual = amigos;

      if (listaAtual.length === 0) {
        listaAtual = await carregarAmigos();
      }

      await verificarNovasMensagens(listaAtual);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [token, amigos, ultimaMensagemPorAmizade, amigoSelecionado]);

  useEffect(() => {
    if (aberto) {
      carregarAmigos();
    }
  }, [aberto, token]);

  useEffect(() => {
    mensagensFinalRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [mensagens]);

  return (
    <>
      <button
        type="button"
        className="chat-floating-button"
        onClick={() => {
          setAberto(true);
          setTotalNovasMensagens(0);
        }}
      >
        💬

        {totalNovasMensagens > 0 && (
          <span className="chat-notification-badge">
            {totalNovasMensagens > 9 ? "9+" : totalNovasMensagens}
          </span>
        )}
      </button>

      <aside className={aberto ? "chat-sidebar open" : "chat-sidebar"}>
        <div className="chat-header">
          <div>
            <span>Social</span>
            <h2>Amigos</h2>
          </div>

          <div className="chat-header-actions">
            {permissaoNotificacao !== "granted" &&
              permissaoNotificacao !== "unsupported" && (
                <button
                  type="button"
                  className="chat-notification-button"
                  onClick={ativarNotificacoes}
                  title="Ativar notificações"
                >
                  🔔
                </button>
              )}

            <button type="button" onClick={() => setAberto(false)}>
              ✕
            </button>
          </div>
        </div>

        <div className="chat-body">
          <section className="chat-friends-list">
            {amigos.length === 0 ? (
              <p className="chat-empty">Nenhum amigo disponível.</p>
            ) : (
              amigos.map((amigo) => (
                <button
                  key={amigo.id}
                  type="button"
                  className={
                    amigoSelecionado?.id === amigo.id
                      ? "chat-friend active"
                      : "chat-friend"
                  }
                  onClick={() => selecionarAmigo(amigo)}
                >
                  <span className={amigo.user.isOnline ? "chat-status-dot online": "chat-status-dot"} />

                  <div>
                    <strong>{amigo.user.name}</strong>
                    <small>{amigo.user.isOnline ? "Online agora" : `Visto por último: ${amigo.user.lastSeenAt || "indisponível"}`}</small>
                  </div>
                </button>
              ))
            )}
          </section>

          <section className="chat-conversation">
            {!amigoSelecionado ? (
              <div className="chat-placeholder">
                <h3>Selecione um amigo</h3>
                <p>Escolha alguém da lista para iniciar a conversa.</p>
              </div>
            ) : (
              <>
                <div className="chat-conversation-header">
                  <strong>{amigoSelecionado.user.name}</strong>
                  <small>Conversa privada</small>
                </div>

                <div className="chat-messages">
                  {carregandoMensagens && mensagens.length === 0 ? (
                    <p className="chat-empty">Carregando mensagens...</p>
                  ) : mensagens.length === 0 ? (
                    <p className="chat-empty">Nenhuma mensagem ainda.</p>
                  ) : (
                    mensagens.map((mensagem) => {
                      const minhaMensagem = mensagem.senderId === usuario?.id;

                      return (
                        <div
                          key={mensagem.id}
                          className={
                            minhaMensagem
                              ? "chat-message mine"
                              : "chat-message"
                          }
                        >
                          <p>{mensagem.content}</p>
                          <small>{mensagem.createdAt}</small>
                        </div>
                      );
                    })
                  )}

                  <div ref={mensagensFinalRef} />
                </div>

                {erro && <p className="chat-error">{erro}</p>}

                <form className="chat-form" onSubmit={handleEnviarMensagem}>
                  <input
                    type="text"
                    placeholder="Digite uma mensagem..."
                    value={texto}
                    onChange={(event) => setTexto(event.target.value)}
                  />

                  <button type="submit">Enviar</button>
                </form>
              </>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}

export default ChatSidebar;