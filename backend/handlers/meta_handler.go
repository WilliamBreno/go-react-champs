package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"projeto-go-react/models"
	"projeto-go-react/services"
)

func MetaChampionHandler(w http.ResponseWriter, r *http.Request) {
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

	_, ok := GetUserIDFromRequest(r)
	if !ok {
		http.Error(w, "Usuário não autenticado", http.StatusUnauthorized)
		return
	}

	champion := strings.TrimSpace(r.URL.Query().Get("champion"))
	lane := strings.TrimSpace(r.URL.Query().Get("lane"))

	if champion == "" {
		http.Error(w, "Champion é obrigatório", http.StatusBadRequest)
		return
	}

	if lane == "" {
		lane = "Mid"
	}

	meta, err := services.GetChampionMetaFromOPGG(champion, lane)
	if err == nil {
		json.NewEncoder(w).Encode(meta)
		return
	}

	log.Println("[OPGG] Falha ao buscar meta real, usando mock:", err)

	meta = gerarMetaMockada(champion, lane)

	json.NewEncoder(w).Encode(meta)
}

func gerarMetaMockada(champion string, lane string) models.ChampionMetaResponse {
	championLower := strings.ToLower(champion)

	rank := 15
	winRate := 49.2
	pickRate := 4.1
	status := "Fraco"

	if championLower == "yone" || championLower == "ahri" || championLower == "jinx" || championLower == "gnar" {
		rank = 2
		winRate = 52.4
		pickRate = 9.8
		status = "Forte"
	} else if championLower == "yasuo" || championLower == "lux" || championLower == "lee sin" {
		rank = 8
		winRate = 50.6
		pickRate = 7.3
		status = "Ok"
	}

	buildJSON := `{
		"items": [
			"Item principal 1",
			"Item principal 2",
			"Item principal 3"
		],
		"source": "mock"
	}`

	return models.ChampionMetaResponse{
		Champion:         champion,
		Lane:             lane,
		MetaStatus:       status,
		MetaRankPosition: rank,
		MetaWinRate:      winRate,
		MetaPickRate:     pickRate,
		MetaBuildJSON:    buildJSON,
	}
}