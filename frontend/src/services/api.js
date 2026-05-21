const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function listarChampions(
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

  const resposta = await fetch(`${API_URL}/champions?${params.toString()}`);

  if (!resposta.ok) {
    throw new Error("Erro ao buscar campeões");
  }

  return resposta.json();
}

export async function cadastrarChampion(champion) {
  const resposta = await fetch(`${API_URL}/champions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(champion),
  });

  if (!resposta.ok) {
    throw new Error("Erro ao cadastrar campeão");
  }

  return resposta.json();
}

export async function editarChampion(id, champion) {
  const resposta = await fetch(`${API_URL}/champions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(champion),
  });

  if (!resposta.ok) {
    throw new Error("Erro ao editar campeão");
  }

  return resposta.json();
}

export async function excluirChampion(id) {
  const resposta = await fetch(`${API_URL}/champions/${id}`, {
    method: "DELETE",
  });

  if (!resposta.ok) {
    throw new Error("Erro ao excluir campeão");
  }
}