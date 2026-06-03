const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index++) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function buscarVapidPublicKey() {
  const resposta = await fetch(`${API_URL}/push/public-key`);

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao buscar chave pública push");
  }

  const dados = await resposta.json();

  return dados.publicKey;
}

async function salvarInscricaoPush(token, subscription) {
  const resposta = await fetch(`${API_URL}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscription),
  });

  if (!resposta.ok) {
    const mensagem = await resposta.text();
    throw new Error(mensagem || "Erro ao salvar inscrição push");
  }

  return resposta.json();
}

export async function ativarPushNotifications(token) {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker não suportado neste navegador.");
  }

  if (!("PushManager" in window)) {
    throw new Error("Push Notification não suportado neste navegador.");
  }

  const permissao = await Notification.requestPermission();

  if (permissao !== "granted") {
    throw new Error("Permissão de notificação não concedida.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    await salvarInscricaoPush(token, existingSubscription);
    return existingSubscription;
  }

  const publicKey = await buscarVapidPublicKey();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await salvarInscricaoPush(token, subscription);

  return subscription;
}