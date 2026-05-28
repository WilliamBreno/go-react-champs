package handlers

import (
	"encoding/json"
	"net/http"

	"projeto-go-react/database"
	"projeto-go-react/models"
)

func RiotProfileHandler(w http.ResponseWriter, r *http.Request) {
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

	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		http.Error(w, "Usuário não autenticado", http.StatusUnauthorized)
		return
	}

	var riotAccount models.RiotAccount

	err := database.DB.QueryRow(
		`
		SELECT
			id,
			user_id,
			game_name,
			tag_line,
			region,
			puuid,
			summoner_id,
			profile_icon_id,
			summoner_level
		FROM riot_accounts
		WHERE user_id = $1
		`,
		userID,
	).Scan(
		&riotAccount.ID,
		&riotAccount.UserID,
		&riotAccount.GameName,
		&riotAccount.TagLine,
		&riotAccount.Region,
		&riotAccount.PUUID,
		&riotAccount.SummonerID,
		&riotAccount.ProfileIconID,
		&riotAccount.SummonerLevel,
	)

	if err != nil {
		http.Error(w, "Nenhuma conta Riot vinculada: "+err.Error(), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(riotAccount)
}