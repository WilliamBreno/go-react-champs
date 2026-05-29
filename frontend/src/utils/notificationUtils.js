export async function solicitarPermissaoNotificacao() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  const permissao = await Notification.requestPermission();

  return permissao;
}

export function notificarNovaMensagem({ titulo, corpo }) {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  new Notification(titulo, {
    body: corpo,
    icon: "/riot.txt",
    tag: "nova-mensagem-chat",
  });
}

export function tocarSomNotificacao() {
  const audio = new Audio("/sounds/notification.wav");
  audio.volume = 0.55;

  audio.play().catch(() => {
    // O navegador pode bloquear áudio sem interação prévia.
  });
}

export function piscarTituloDaPagina(texto = "Nova mensagem!") {
  const tituloOriginal = document.title;
  let contador = 0;

  const intervalo = setInterval(() => {
    document.title = document.title === tituloOriginal ? texto : tituloOriginal;
    contador++;

    if (contador >= 8) {
      clearInterval(intervalo);
      document.title = tituloOriginal;
    }
  }, 800);
}