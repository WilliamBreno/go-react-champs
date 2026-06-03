package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"projeto-go-react/models"
)

const opggMCPEndpoint = "https://mcp-api.op.gg/mcp"

type mcpRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      int         `json:"id"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
}

type mcpToolCallParams struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

func GetChampionMetaFromOPGG(champion string, lane string) (models.ChampionMetaResponse, error) {
	champion = strings.TrimSpace(champion)
	lane = normalizarLaneOPGG(lane)

	if champion == "" {
		return models.ChampionMetaResponse{}, errors.New("champion vazio")
	}

	meta, err := buscarMetaPorLane(champion, lane)
	if err != nil {
		return models.ChampionMetaResponse{}, err
	}

	return meta, nil
}

func buscarMetaPorLane(champion string, lane string) (models.ChampionMetaResponse, error) {
	payload := mcpRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "tools/call",
		Params: mcpToolCallParams{
			Name: "lol_list_lane_meta_champions",
			Arguments: map[string]interface{}{
				"lane": lane,
				"desired_output_fields": []string{
					"champions[].name",
					"champions[].rank",
					"champions[].tier",
					"champions[].win_rate",
					"champions[].pick_rate",
					"champions[].ban_rate",
				},
			},
		},
	}

	raw, err := callOPGGMCP(payload)
	if err != nil {
		return models.ChampionMetaResponse{}, err
	}

	meta, err := extrairMetaDoTexto(raw, champion, lane)
	if err != nil {
		return models.ChampionMetaResponse{}, err
	}

	return meta, nil
}

func callOPGGMCP(payload interface{}) ([]byte, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	client := &http.Client{
		Timeout: 18 * time.Second,
	}

	req, err := http.NewRequest(http.MethodPost, opggMCPEndpoint, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/event-stream")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("OP.GG MCP retornou status %d: %s", resp.StatusCode, string(raw))
	}

	return raw, nil
}

func extrairMetaDoTexto(raw []byte, champion string, lane string) (models.ChampionMetaResponse, error) {
	texto := string(raw)

	championLower := strings.ToLower(champion)

	if !strings.Contains(strings.ToLower(texto), championLower) {
		return models.ChampionMetaResponse{}, fmt.Errorf("campeão %s não encontrado no retorno OP.GG", champion)
	}

	// Primeira versão segura:
	// Como o retorno MCP pode vir em formatos diferentes, começamos detectando presença
	// do campeão e calculando um status provisório até mapearmos o JSON exato.
	// No próximo passo refinamos isso com o retorno real dos logs.
	rank := 0
	status := "Ok"

	if strings.Contains(strings.ToLower(texto), `"rank":1`) ||
		strings.Contains(strings.ToLower(texto), `"rank":2`) ||
		strings.Contains(strings.ToLower(texto), `"rank":3`) {
		status = "Forte"
		rank = 3
	}

	return models.ChampionMetaResponse{
		Champion:         champion,
		Lane:             lane,
		MetaStatus:       status,
		MetaRankPosition: rank,
		MetaWinRate:      0,
		MetaPickRate:     0,
		MetaBuildJSON:    `{"source":"opgg-mcp","raw":true}`,
	}, nil
}

func normalizarLaneOPGG(lane string) string {
	switch strings.ToLower(strings.TrimSpace(lane)) {
	case "top":
		return "top"
	case "jungle", "jg":
		return "jungle"
	case "mid", "middle":
		return "mid"
	case "adc", "bottom", "bot":
		return "adc"
	case "support", "sup":
		return "support"
	default:
		return "mid"
	}
}