const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

export async function buscarMetaChampion(token, champion, lane) {
  const params = new URLSearchParams();

  params.set("champion", champion);
  params.set("lane", lane);

  const resposta = await fetch(`${API_URL}/meta/champion?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao buscar meta do campeão");
  }

  return resposta.json();
}

export async function salvarMetaChampion(token, championId, meta) {
  const resposta = await fetch(`${API_URL}/champions/${championId}/meta`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      metaStatus: meta.metaStatus,
      metaRankPosition: meta.metaRankPosition,
      metaWinRate: meta.metaWinRate,
      metaPickRate: meta.metaPickRate,
      metaBuildJson: meta.metaBuildJson || "{}",
    }),
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao salvar meta do campeão");
  }

  return resposta.json();
}