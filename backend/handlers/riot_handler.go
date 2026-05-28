package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"projeto-go-react/database"
	"projeto-go-react/models"
)

func buscarRankedRiot(region string, summonerID string) ([]models.RiotRankedEntry, error) {
	riotAPIKey := os.Getenv("RIOT_API_KEY")
	if riotAPIKey == "" {
		return nil, fmt.Errorf("RIOT_API_KEY não configurada")
	}

	if summonerID == "" {
		return []models.RiotRankedEntry{}, nil
	}

	rankedURL := fmt.Sprintf(
		"https://%s.api.riotgames.com/lol/league/v4/entries/by-summoner/%s",
		region,
		url.PathEscape(summonerID),
	)

	req, err := http.NewRequest(http.MethodGet, rankedURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("X-Riot-Token", riotAPIKey)

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("League API retornou status %d", resp.StatusCode)
	}

	var ranked []models.RiotRankedEntry

	err = json.NewDecoder(resp.Body).Decode(&ranked)
	if err != nil {
		return nil, err
	}

	return ranked, nil
}

func buscarStatusPartidaAtual(region string, puuid string) models.RiotLiveGameStatus {
	riotAPIKey := os.Getenv("RIOT_API_KEY")
	if riotAPIKey == "" || puuid == "" {
		return models.RiotLiveGameStatus{
			IsInGame: false,
		}
	}

	spectatorURL := fmt.Sprintf(
		"https://%s.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/%s",
		region,
		url.PathEscape(puuid),
	)

	req, err := http.NewRequest(http.MethodGet, spectatorURL, nil)
	if err != nil {
		return models.RiotLiveGameStatus{
			IsInGame: false,
		}
	}

	req.Header.Set("X-Riot-Token", riotAPIKey)

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return models.RiotLiveGameStatus{
			IsInGame: false,
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return models.RiotLiveGameStatus{
			IsInGame: false,
		}
	}

	if resp.StatusCode != http.StatusOK {
		return models.RiotLiveGameStatus{
			IsInGame: false,
		}
	}

	var liveGame struct {
		GameID            int64  `json:"gameId"`
		GameMode          string `json:"gameMode"`
		GameType          string `json:"gameType"`
		GameQueueConfigID int    `json:"gameQueueConfigId"`
		GameStartTime     int64  `json:"gameStartTime"`
		GameLength        int64  `json:"gameLength"`
	}

	err = json.NewDecoder(resp.Body).Decode(&liveGame)
	if err != nil {
		return models.RiotLiveGameStatus{
			IsInGame: false,
		}
	}

	return models.RiotLiveGameStatus{
		IsInGame:          true,
		GameID:            liveGame.GameID,
		GameMode:          liveGame.GameMode,
		GameType:          liveGame.GameType,
		GameQueueConfigID: liveGame.GameQueueConfigID,
		GameStartTime:     liveGame.GameStartTime,
		GameLength:        liveGame.GameLength,
	}
}

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
			COALESCE(summoner_id, ''),
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

	ranked, err := buscarRankedRiot(riotAccount.Region, riotAccount.SummonerID)
	if err != nil {
		ranked = []models.RiotRankedEntry{}
	}

	liveStatus := buscarStatusPartidaAtual(riotAccount.Region, riotAccount.PUUID)

	response := models.RiotProfileResponse{
		RiotAccount: riotAccount,
		Ranked:      ranked,
		LiveStatus:  liveStatus,
	}

	json.NewEncoder(w).Encode(response)
}