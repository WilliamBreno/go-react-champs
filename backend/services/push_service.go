package services

import (
	"encoding/json"
	"log"
	"os"

	webpush "github.com/SherClockHolmes/webpush-go"

	"projeto-go-react/database"
)

type PushPayload struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	URL   string `json:"url"`
}

func SendPushToUser(userID int, payload PushPayload) {
	vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")
	vapidSubject := os.Getenv("VAPID_SUBJECT")

	if vapidPrivateKey == "" {
		log.Println("VAPID_PRIVATE_KEY não configurada")
		return
	}

	if vapidSubject == "" {
		vapidSubject = "mailto:admin@example.com"
	}

	rows, err := database.DB.Query(
		`
		SELECT endpoint, p256dh, auth
		FROM push_subscriptions
		WHERE user_id = $1
		`,
		userID,
	)

	if err != nil {
		log.Println("Erro ao buscar inscrições push:", err)
		return
	}
	defer rows.Close()

	body, err := json.Marshal(payload)
	if err != nil {
		log.Println("Erro ao montar payload push:", err)
		return
	}

	for rows.Next() {
		var endpoint string
		var p256dh string
		var auth string

		err := rows.Scan(&endpoint, &p256dh, &auth)
		if err != nil {
			log.Println("Erro ao ler inscrição push:", err)
			continue
		}

		subscription := &webpush.Subscription{
			Endpoint: endpoint,
			Keys: webpush.Keys{
				P256dh: p256dh,
				Auth:   auth,
			},
		}

		resp, err := webpush.SendNotification(body, subscription, &webpush.Options{
			Subscriber:      vapidSubject,
			VAPIDPrivateKey: vapidPrivateKey,
			TTL:             60,
			AuthScheme:      webpush.WebPush,
		})

		if err != nil {
			log.Println("Erro ao enviar push:", err)
			continue
		}

		if resp != nil {
			resp.Body.Close()

			if resp.StatusCode == 404 || resp.StatusCode == 410 {
				_, _ = database.DB.Exec(
					`DELETE FROM push_subscriptions WHERE endpoint = $1`,
					endpoint,
				)
			}
		}
	}
}