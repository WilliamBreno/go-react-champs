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

  if (resposta.status === 204) {
    return true;
  }

  return resposta.json();
}

export async function buscarUsuarios(token, query) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.append("query", query.trim());
  }

  const resposta = await fetch(`${API_URL}/users/search?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta, "Erro ao buscar usuários");
}

export async function enviarSolicitacaoAmizade(token, receiverId) {
  const resposta = await fetch(`${API_URL}/friends/request`, {
    method: "POST",
    headers: criarHeaders(token),
    body: JSON.stringify({
      receiverId,
    }),
  });

  return tratarResposta(resposta, "Erro ao enviar solicitação");
}

export async function listarAmigos(token) {
  const resposta = await fetch(`${API_URL}/friends`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta, "Erro ao listar amigos");
}

export async function listarSolicitacoes(token) {
  const resposta = await fetch(`${API_URL}/friends/requests`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta, "Erro ao listar solicitações");
}

export async function aceitarSolicitacao(token, friendshipId) {
  const resposta = await fetch(`${API_URL}/friends/accept`, {
    method: "PUT",
    headers: criarHeaders(token),
    body: JSON.stringify({
      friendshipId,
    }),
  });

  return tratarResposta(resposta, "Erro ao aceitar solicitação");
}

export async function recusarSolicitacao(token, friendshipId) {
  const resposta = await fetch(`${API_URL}/friends/reject`, {
    method: "PUT",
    headers: criarHeaders(token),
    body: JSON.stringify({
      friendshipId,
    }),
  });

  return tratarResposta(resposta, "Erro ao recusar solicitação");
}

export async function removerAmigo(token, friendshipId) {
  const resposta = await fetch(`${API_URL}/friends/${friendshipId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta, "Erro ao remover amigo");
}