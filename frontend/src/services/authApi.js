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

function tratarErroDeConexao(erro) {
  if (
    erro.message === "Failed to fetch" ||
    erro.message === "Load failed" ||
    erro.name === "TypeError"
  ) {
    throw new Error(
      `Não foi possível conectar ao servidor. API usada: ${API_URL}`
    );
  }

  throw erro;
}

export async function registrarUsuario(dados) {
  try {
    const resposta = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    return await tratarResposta(resposta, "Erro ao cadastrar usuário");
  } catch (erro) {
    tratarErroDeConexao(erro);
  }
}

export async function loginUsuario(dados) {
  try {
    const resposta = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    return await tratarResposta(resposta, "Erro ao fazer login");
  } catch (erro) {
    tratarErroDeConexao(erro);
  }
}