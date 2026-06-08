package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"projeto-go-react/models"
)

const opggMCPEndpoint = "https://mcp-api.op.gg/mcp"

type MCPRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      int         `json:"id"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
}

type MCPToolCallParams struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

func GetChampionMetaFromOPGG(champion string, lane string) (models.ChampionMetaResponse, error) {
	champion = strings.TrimSpace(champion)
	lane = normalizarLaneOPGG(lane)

	if champion == "" {
		return models.ChampionMetaResponse{}, errors.New("champion vazio")
	}

	meta, err := buscarMetaPorLaneOPGG(champion, lane)
	if err != nil {
		return models.ChampionMetaResponse{}, err
	}

	return meta, nil
}
func ChampionToOPGG(champion string) string {
	champion = strings.TrimSpace(champion)
	champion = strings.ToUpper(champion)
	champion = strings.ReplaceAll(champion, " ", "_")
	return champion
}
func buscarMetaPorLaneOPGG(champion string, lane string) (models.ChampionMetaResponse, error) {
	payload := MCPRequest{
		JSONRPC: "2.0",
		ID: 1,
		Method: "tools/call",
		Params: MCPToolCallParams{
			Name: "lol_get_champion_analysis",
			Arguments: map[string]interface{}{
				"game_mode": "ranked",
				"champion": ChampionToOPGG(champion),
				"position": lane,
				"desired_output_fields": []string{
					"champion",
					"data.summary.average_stats.win_rate",
					"data.summary.average_stats.pick_rate",
					"data.summary.average_stats.ban_rate",
					"data.summary.average_stats.rank",
					"data.summary.average_stats.tier",
				},
			},
		},
	}

	raw, err := chamarOPGGMCP(payload)
	if err != nil {
		return models.ChampionMetaResponse{}, err
	}

	texto := extrairTextoMCP(raw)

	log.Println("[OPGG RAW]", texto)

	meta, err := extrairMetaDoRetornoOPGG(texto, champion, lane)
	if err != nil {
		return models.ChampionMetaResponse{}, err
	}

	return meta, nil
}

func chamarOPGGMCP(payload interface{}) ([]byte, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	client := &http.Client{
		Timeout: 20 * time.Second,
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
		return nil, fmt.Errorf("OP.GG MCP status %d: %s", resp.StatusCode, string(raw))
	}

	return raw, nil
}

func extrairTextoMCP(raw []byte) string {
	texto := string(raw)

	var resposta map[string]interface{}
	err := json.Unmarshal(raw, &resposta)
	if err != nil {
		return texto
	}

	result, ok := resposta["result"].(map[string]interface{})
	if !ok {
		return texto
	}

	content, ok := result["content"].([]interface{})
	if !ok {
		return texto
	}

	var partes []string

	for _, item := range content {
		itemMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}

		if text, ok := itemMap["text"].(string); ok {
			partes = append(partes, text)
		}
	}

	if len(partes) == 0 {
		return texto
	}

	return strings.Join(partes, "\n")
}

func extrairMetaDoRetornoOPGG(
    texto string,
    champion string,
    lane string,
) (models.ChampionMetaResponse, error) {

    re := regexp.MustCompile(
        `AverageStats\(([0-9.]+),([0-9.]+),([0-9.]+),([0-9]+),([0-9]+)\)`,
    )

    m := re.FindStringSubmatch(texto)

    if len(m) != 6 {
        return models.ChampionMetaResponse{},
            fmt.Errorf("AverageStats não encontrado")
    }

    winRate, _ := strconv.ParseFloat(m[1], 64)
    pickRate, _ := strconv.ParseFloat(m[2], 64)
    banRate, _ := strconv.ParseFloat(m[3], 64)

    rank, _ := strconv.Atoi(m[4])
    tier, _ := strconv.Atoi(m[5])

    // converter fração -> %
    winRate *= 100
    pickRate *= 100
    banRate *= 100

    metaStatus := calcularMetaStatus(rank)

    buildJSON := fmt.Sprintf(
        `{
            "source":"opgg-mcp",
            "champion":"%s",
            "lane":"%s",
            "tier":%d,
            "ban_rate":%.2f
        }`,
        champion,
        lane,
        tier,
        banRate,
    )

    return models.ChampionMetaResponse{
        Champion: champion,
        Lane: lane,

        MetaStatus:       metaStatus,
        MetaRankPosition: rank,
        MetaWinRate:      winRate,
        MetaPickRate:     pickRate,
        MetaBuildJSON:    buildJSON,
    }, nil
}



func calcularMetaStatus(rank int) string {
	if rank > 0 && rank <= 3 {
		return "Forte"
	}

	if rank > 0 && rank <= 10 {
		return "Ok"
	}

	if rank > 10 {
		return "Fraco"
	}

	return "Não analisado"
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

func escapeJSON(valor string) string {
	valor = strings.ReplaceAll(valor, `\`, `\\`)
	valor = strings.ReplaceAll(valor, `"`, `\"`)
	return valor
}

func DebugListOPGGTools() {
	payload := MCPRequest{
		JSONRPC: "2.0",
		ID:      99,
		Method:  "tools/list",
	}

	raw, err := chamarOPGGMCP(payload)
	if err != nil {
		log.Println("[OPGG TOOLS ERROR]", err)
		return
	}

	log.Println("[OPGG TOOLS RAW]", string(raw))
}


