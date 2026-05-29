const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

export async function atualizarStatusOnline(token) {
  const resposta = await fetch(`${API_URL}/me/ping`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao atualizar status online");
  }

  return resposta.json();
}