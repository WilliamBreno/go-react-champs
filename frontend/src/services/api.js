const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

async function tratarResposta(resposta, mensagemPadrao) {
  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || mensagemPadrao);
  }

  return resposta.json();
}

function criarHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listarChampions(
  token,
  nome = "",
  ordem = "recentes",
  page = 1,
  limit = 5
) {
  const params = new URLSearchParams();

  if (nome.trim() !== "") {
    params.append("nome", nome);
  }

  if (ordem) {
    params.append("ordem", ordem);
  }

  params.append("page", page);
  params.append("limit", limit);

  const resposta = await fetch(`${API_URL}/champions?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta, "Erro ao buscar campeões");
}

export async function cadastrarChampion(token, champion) {
  const resposta = await fetch(`${API_URL}/champions`, {
    method: "POST",
    headers: criarHeaders(token),
    body: JSON.stringify(champion),
  });

  return tratarResposta(resposta, "Erro ao cadastrar campeão");
}

export async function editarChampion(token, id, champion) {
  const resposta = await fetch(`${API_URL}/champions/${id}`, {
    method: "PUT",
    headers: criarHeaders(token),
    body: JSON.stringify(champion),
  });

  return tratarResposta(resposta, "Erro ao editar campeão");
}

export async function excluirChampion(token, id) {
  const resposta = await fetch(`${API_URL}/champions/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao excluir campeão");
  }

  return true;
}