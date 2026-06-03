const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

function getHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listarChampions({
  token,
  page = 1,
  limit = 5,
  nome = "",
  lane = "Todos",
  status = "Todos",
  ordem = "recentes",
}) {
  const params = new URLSearchParams();

  params.set("page", page);
  params.set("limit", limit);
  params.set("ordem", ordem);

  if (nome.trim()) {
    params.set("nome", nome.trim());
  }

  if (lane && lane !== "Todos") {
    params.set("lane", lane);
  }

  if (status && status !== "Todos") {
    params.set("status", status);
  }

  const resposta = await fetch(`${API_URL}/champions?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao listar pool de campeões");
  }

  return resposta.json();
}

export async function cadastrarChampion(token, champion) {
  const resposta = await fetch(`${API_URL}/champions`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({
      nome: champion.nome,
      lane: champion.lane,
      prioridade: champion.prioridade,
      status: champion.status,
      notes: champion.notes,
      riotDifficulty: champion.riotDifficulty,
    }),
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao adicionar campeão ao pool");
  }

  return resposta.json();
}

export async function editarChampion(token, id, champion) {
  const resposta = await fetch(`${API_URL}/champions/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({
      nome: champion.nome,
      lane: champion.lane,
      prioridade: champion.prioridade,
      status: champion.status,
      notes: champion.notes,
      riotDifficulty: champion.riotDifficulty,
    }),
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao editar campeão do pool");
  }

  return resposta.json();
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
    throw new Error(mensagem || "Erro ao remover campeão do pool");
  }

  return true;
}