package handlers

import (
	"encoding/json"
	"net/http"

	"projeto-go-react/database"
)

func PingUserHandler(w http.ResponseWriter, r *http.Request) {
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

	_, err := database.DB.Exec(
		`
		UPDATE users
		SET last_seen_at = CURRENT_TIMESTAMP
		WHERE id = $1
		`,
		userID,
	)

	if err != nil {
		http.Error(w, "Erro ao atualizar status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Status atualizado",
	})
}