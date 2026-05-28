import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { listarAmigos } from "../services/friendApi";
import { enviarMensagem, listarMensagens } from "../services/chatApi";

function ChatSidebar() {
  const { token, usuario } = useAuth();

  const [aberto, setAberto] = useState(false);
  const [amigos, setAmigos] = useState([]);
  const [amigoSelecionado, setAmigoSelecionado] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");

  const [erro, setErro] = useState("");
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);

  async function carregarAmigos() {
    if (!token) return;

    try {
      const dados = await listarAmigos(token);
      setAmigos(dados || []);
    } catch (erro) {
      console.error("Erro ao carregar amigos do chat:", erro);
      setErro("Erro ao carregar amigos.");
    }
  }

  async function carregarMensagens(friendshipId) {
    if (!token || !friendshipId) return;

    try {
      setCarregandoMensagens(true);

      const dados = await listarMensagens(token, friendshipId);
      setMensagens(dados || []);
    } catch (erro) {
      console.error("Erro ao carregar mensagens:", erro);
      setErro("Erro ao carregar mensagens.");
    } finally {
      setCarregandoMensagens(false);
    }
  }

  async function selecionarAmigo(amigo) {
    setAmigoSelecionado(amigo);
    setErro("");
    await carregarMensagens(amigo.id);
  }

  async function handleEnviarMensagem(event) {
    event.preventDefault();

    if (!texto.trim() || !amigoSelecionado) {
      return;
    }

    try {
      const mensagemEnviada = await enviarMensagem(
        token,
        amigoSelecionado.id,
        texto.trim()
      );

      setMensagens((mensagensAtuais) => [...mensagensAtuais, mensagemEnviada]);
      setTexto("");

      await carregarMensagens(amigoSelecionado.id);
    } catch (erro) {
      console.error("Erro ao enviar mensagem:", erro);
      setErro("Erro ao enviar mensagem.");
    }
  }

  useEffect(() => {
    if (aberto) {
      carregarAmigos();
    }
  }, [aberto, token]);

  useEffect(() => {
    if (!amigoSelecionado) return;

    const intervalo = setInterval(() => {
      carregarMensagens(amigoSelecionado.id);
    }, 3000);

    return () => clearInterval(intervalo);
  }, [amigoSelecionado, token]);

  return (
    <>
      <button
        type="button"
        className="chat-floating-button"
        onClick={() => setAberto(true)}
      >
        💬
      </button>

      <aside className={aberto ? "chat-sidebar open" : "chat-sidebar"}>
        <div className="chat-header">
          <div>
            <span>Social</span>
            <h2>Amigos</h2>
          </div>

          <button type="button" onClick={() => setAberto(false)}>
            ✕
          </button>
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
                  <span className="chat-status-dot online" />

                  <div>
                    <strong>{amigo.user.name}</strong>
                    <small>{amigo.user.email}</small>
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