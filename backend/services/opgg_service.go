package services

import (
	"bytes"
	"database/sql"
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

	"projeto-go-react/database"
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

// GetChampionMetaByUserID busca a lane do champion no DB pelo userID
// e então consulta o OP.GG com os dados corretos.
func GetChampionMetaByUserID(userID int, championName string) (models.ChampionMetaResponse, error) {
	var lane string

	query := `
		SELECT COALESCE(lane, 'mid')
		FROM champions
		WHERE user_id = $1 AND LOWER(nome) = LOWER($2)
		LIMIT 1
	`

	err := database.DB.QueryRow(query, userID, championName).Scan(&lane)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.ChampionMetaResponse{},
				fmt.Errorf("champion '%s' não encontrado para o usuário %d", championName, userID)
		}
		return models.ChampionMetaResponse{}, fmt.Errorf("erro ao buscar lane no DB: %w", err)
	}

	return GetChampionMetaFromOPGG(championName, lane)
}

func buscarChampionAnalysisOPGG(champion string, lane string) (models.ChampionMetaResponse, error) {
	payload := MCPRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "tools/call",
		Params: MCPToolCallParams{
			Name: "lol_get_champion_analysis",
			Arguments: map[string]interface{}{
				"game_mode": "ranked",
				"champion":  ChampionToOPGG(champion),
				"position":  lane,
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

func calcularMetaStatusPorTier(tier int) string {
	switch tier {
	case 1:
		return "Forte"
	case 2:
		return "Bom"
	case 3:
		return "Ok"
	case 4:
		return "Fraco"
	default:
		return "Fraco"
	}
}

func extrairMetaLane(
	raw []byte,
	champion string,
	lane string,
) (models.ChampionMetaResponse, error) {

	texto := extrairTextoMCP(raw)

	log.Println("[META TEXT]", texto)

	champion = strings.ToUpper(champion)

	reRank := regexp.MustCompile(`rank[^0-9]*([0-9]+)`)
	reTier := regexp.MustCompile(`tier[^0-9]*([0-9]+)`)
	reWin := regexp.MustCompile(`win_rate[^0-9]*([0-9.]+)`)
	rePick := regexp.MustCompile(`pick_rate[^0-9]*([0-9.]+)`)
	reBan := regexp.MustCompile(`ban_rate[^0-9]*([0-9.]+)`)

	rankMatch := reRank.FindStringSubmatch(texto)
	tierMatch := reTier.FindStringSubmatch(texto)
	winMatch := reWin.FindStringSubmatch(texto)
	pickMatch := rePick.FindStringSubmatch(texto)
	banMatch := reBan.FindStringSubmatch(texto)

	if len(rankMatch) < 2 {
		return models.ChampionMetaResponse{},
			fmt.Errorf("rank não encontrado")
	}

	rank, _ := strconv.Atoi(rankMatch[1])
	tier, _ := strconv.Atoi(tierMatch[1])

	winRate, _ := strconv.ParseFloat(winMatch[1], 64)
	pickRate, _ := strconv.ParseFloat(pickMatch[1], 64)
	banRate, _ := strconv.ParseFloat(banMatch[1], 64)

	return models.ChampionMetaResponse{
		Champion:         champion,
		Lane:             lane,
		MetaRankPosition: rank,
		MetaTier:         tier,
		MetaStatus:       calcularMetaStatusPorTier(tier),
		MetaWinRate:      winRate * 100,
		MetaPickRate:     pickRate * 100,
		MetaBanRate:      banRate * 100,
	}, nil
}

func buscarMetaPorLaneOPGG(
	champion string,
	lane string,
) (models.ChampionMetaResponse, error) {

	payload := MCPRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "tools/call",
		Params: MCPToolCallParams{
			Name: "lol_list_lane_meta_champions",
			Arguments: map[string]interface{}{
				"position": lane,
				"desired_output_fields": []string{
					fmt.Sprintf("data.positions.%s[].champion", lane),
					fmt.Sprintf("data.positions.%s[].rank", lane),
					fmt.Sprintf("data.positions.%s[].tier", lane),
					fmt.Sprintf("data.positions.%s[].win_rate", lane),
					fmt.Sprintf("data.positions.%s[].pick_rate", lane),
					fmt.Sprintf("data.positions.%s[].ban_rate", lane),
				},
			},
		},
	}

	raw, err := chamarOPGGMCP(payload)
	if err != nil {
		return models.ChampionMetaResponse{}, err
	}

	log.Println("[OPGG META RAW]", string(raw))

	return extrairMetaLane(raw, champion, lane)
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

	match := re.FindStringSubmatch(texto)

	if len(match) != 6 {
		return models.ChampionMetaResponse{},
			fmt.Errorf("não foi possível extrair stats do retorno OP.GG")
	}

	winRate, _ := strconv.ParseFloat(match[1], 64)
	pickRate, _ := strconv.ParseFloat(match[2], 64)
	banRate, _ := strconv.ParseFloat(match[3], 64)

	rank, _ := strconv.Atoi(match[4])
	tier, _ := strconv.Atoi(match[5])

	metaStatus := calcularMetaStatus(rank)

	buildJSON := fmt.Sprintf(
		`{
			"source":"opgg-mcp",
			"champion":"%s",
			"lane":"%s",
			"rank":%d,
			"tier":%d,
			"win_rate":%.4f,
			"pick_rate":%.4f,
			"ban_rate":%.4f
		}`,
		escapeJSON(champion),
		escapeJSON(lane),
		rank,
		tier,
		winRate,
		pickRate,
		banRate,
	)

	return models.ChampionMetaResponse{
		Champion:         champion,
		Lane:             lane,
		MetaStatus:       metaStatus,
		MetaRankPosition: rank,
		MetaTier:         tier,
		MetaWinRate:      winRate * 100,
		MetaPickRate:     pickRate * 100,
		MetaBanRate:      banRate * 100,
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