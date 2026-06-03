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
		log.Println("[PUSH] VAPID_PRIVATE_KEY não configurada")
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
		log.Println("[PUSH] Erro ao buscar inscrições:", err)
		return
	}
	defer rows.Close()

	body, err := json.Marshal(payload)
	if err != nil {
		log.Println("[PUSH] Erro ao montar payload:", err)
		return
	}

	total := 0
	enviadas := 0

	for rows.Next() {
		total++

		var endpoint string
		var p256dh string
		var auth string

		err := rows.Scan(&endpoint, &p256dh, &auth)
		if err != nil {
			log.Println("[PUSH] Erro ao ler inscrição:", err)
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
		})

		if err != nil {
			log.Println("[PUSH] Erro ao enviar push:", err)
			continue
		}

		if resp != nil {
			log.Println("[PUSH] Status:", resp.StatusCode, "Endpoint:", endpoint)

			resp.Body.Close()

			if resp.StatusCode == 404 || resp.StatusCode == 410 {
				_, _ = database.DB.Exec(
					`DELETE FROM push_subscriptions WHERE endpoint = $1`,
					endpoint,
				)

				log.Println("[PUSH] Inscrição removida por expiração:", endpoint)
				continue
			}

			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				enviadas++
			}
		}
	}

	if err := rows.Err(); err != nil {
		log.Println("[PUSH] Erro ao percorrer inscrições:", err)
	}

	log.Println("[PUSH] Usuário:", userID, "Inscrições:", total, "Enviadas:", enviadas)
}