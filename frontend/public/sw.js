self.addEventListener("push", (event) => {
  let data = {
    title: "Nova notificação",
    body: "Você recebeu uma nova mensagem.",
    url: "/dashboard",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Nova mensagem", {
      body: data.body || "Você recebeu uma nova mensagem.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: {
        url: data.url || "/dashboard",
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});