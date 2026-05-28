const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

function criarHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function tratarResposta(resposta, mensagemPadrao) {
  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || mensagemPadrao);
  }

  return resposta.json();
}

export async function listarMensagens(token, friendshipId) {
  const resposta = await fetch(`${API_URL}/chat/messages/${friendshipId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta, "Erro ao listar mensagens");
}

export async function enviarMensagem(token, friendshipId, content) {
  const resposta = await fetch(`${API_URL}/chat/messages`, {
    method: "POST",
    headers: criarHeaders(token),
    body: JSON.stringify({
      friendshipId,
      content,
    }),
  });

  return tratarResposta(resposta, "Erro ao enviar mensagem");
}