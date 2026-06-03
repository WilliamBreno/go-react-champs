self.addEventListener("push", (event) => {
  let data = {
    title: "Nova mensagem",
    body: "Você recebeu uma nova mensagem.",
    url: "/friends",
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
      icon: "/logo.png",
      badge: "/logo.png",
      data: {
        url: data.url || "/friends",
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/friends";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();

            if ("navigate" in client) {
              return client.navigate(urlToOpen);
            }

            return;
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});