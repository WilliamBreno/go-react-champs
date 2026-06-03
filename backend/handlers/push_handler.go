package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"projeto-go-react/database"
	"projeto-go-react/models"
)

func GetVapidPublicKeyHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(w)
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	publicKey := os.Getenv("VAPID_PUBLIC_KEY")
	if publicKey == "" {
		http.Error(w, "VAPID_PUBLIC_KEY não configurada", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"publicKey": publicKey,
	})
}

func SavePushSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(w)
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		http.Error(w, "Usuário não autenticado", http.StatusUnauthorized)
		return
	}

	var request models.PushSubscriptionRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if request.Endpoint == "" || request.Keys.P256dh == "" || request.Keys.Auth == "" {
		http.Error(w, "Inscrição push inválida", http.StatusBadRequest)
		return
	}

	userAgent := r.UserAgent()

	_, err = database.DB.Exec(
		`
		INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (endpoint)
		DO UPDATE SET
			user_id = EXCLUDED.user_id,
			p256dh = EXCLUDED.p256dh,
			auth = EXCLUDED.auth,
			user_agent = EXCLUDED.user_agent,
			updated_at = CURRENT_TIMESTAMP
		`,
		userID,
		request.Endpoint,
		request.Keys.P256dh,
		request.Keys.Auth,
		userAgent,
	)

	if err != nil {
		http.Error(w, "Erro ao salvar inscrição push: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Inscrição push salva com sucesso",
	})
}