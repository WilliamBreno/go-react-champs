const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function registrarUsuario(dados) {
  const resposta = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao cadastrar usuário");
  }

  return resposta.json();
}

export async function loginUsuario(dados) {
  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao fazer login");
  }

  return resposta.json();
}