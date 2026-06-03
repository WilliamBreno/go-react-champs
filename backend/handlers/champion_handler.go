package handlers

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"strings"

	"projeto-go-react/database"
	"projeto-go-react/models"
)

func EnableCors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func ChampionsHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(w)
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		http.Error(w, "Usuário não autenticado", http.StatusUnauthorized)
		return
	}

	switch r.Method {
	case http.MethodGet:
		listarChampions(w, r, userID)

	case http.MethodPost:
		cadastrarChampion(w, r, userID)

	default:
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
	}
}

func ChampionByIDHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(w)
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		http.Error(w, "Usuário não autenticado", http.StatusUnauthorized)
		return
	}

	idTexto := strings.TrimPrefix(r.URL.Path, "/champions/")
	id, err := strconv.Atoi(idTexto)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodPut:
		editarChampion(w, r, id, userID)

	case http.MethodDelete:
		excluirChampion(w, r, id, userID)

	default:
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
	}
}

func listarChampions(w http.ResponseWriter, r *http.Request, userID int) {
	nome := strings.TrimSpace(r.URL.Query().Get("nome"))
	lane := strings.TrimSpace(r.URL.Query().Get("lane"))
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	ordem := r.URL.Query().Get("ordem")

	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page <= 0 {
		page = 1
	}

	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit <= 0 {
		limit = 5
	}

	offset := (page - 1) * limit

	where := "WHERE user_id = $1"
	args := []interface{}{userID}
	paramIndex := 2

	if nome != "" {
		where += " AND nome ILIKE $" + strconv.Itoa(paramIndex)
		args = append(args, "%"+nome+"%")
		paramIndex++
	}

	if lane != "" && lane != "Todos" {
		where += " AND lane = $" + strconv.Itoa(paramIndex)
		args = append(args, lane)
		paramIndex++
	}

	if status != "" && status != "Todos" {
		where += " AND status = $" + strconv.Itoa(paramIndex)
		args = append(args, status)
		paramIndex++
	}

	orderBy := "ORDER BY id DESC"

	switch ordem {
	case "nome_az":
		orderBy = "ORDER BY nome ASC"

	case "nome_za":
		orderBy = "ORDER BY nome DESC"

	case "lane":
		orderBy = "ORDER BY lane ASC, nome ASC"

	case "prioridade":
		orderBy = `
		ORDER BY
			CASE prioridade
				WHEN 'Main' THEN 1
				WHEN 'Secundário' THEN 2
				WHEN 'Pocket Pick' THEN 3
				WHEN 'Testando' THEN 4
				ELSE 5
			END,
			nome ASC
		`

	case "status":
		orderBy = `
		ORDER BY
			CASE status
				WHEN 'Dominado' THEN 1
				WHEN 'Treinando' THEN 2
				WHEN 'Quero aprender' THEN 3
				WHEN 'Pausado' THEN 4
				ELSE 5
			END,
			nome ASC
		`

	case "dificuldade":
		orderBy = "ORDER BY riot_difficulty DESC, nome ASC"

	case "meta":
		orderBy = `
		ORDER BY
			CASE meta_status
				WHEN 'Forte' THEN 1
				WHEN 'Ok' THEN 2
				WHEN 'Fraco' THEN 3
				ELSE 4
			END,
			meta_rank_position ASC,
			nome ASC
		`

	case "recentes":
		orderBy = "ORDER BY id DESC"
	}

	var total int

	countQuery := "SELECT COUNT(*) FROM champions " + where

	err = database.DB.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		http.Error(w, "Erro ao contar campeões: "+err.Error(), http.StatusInternalServerError)
		return
	}

	query := `
		SELECT
			id,
			nome,
			COALESCE(maestria, 0),
			COALESCE(lane, 'Mid'),
			COALESCE(prioridade, 'Testando'),
			COALESCE(status, 'Quero aprender'),
			COALESCE(notes, ''),
			COALESCE(riot_difficulty, 0),

			COALESCE(meta_status, 'Não analisado'),
			COALESCE(meta_rank_position, 0),
			COALESCE(meta_win_rate, 0),
			COALESCE(meta_pick_rate, 0),
			COALESCE(meta_build_json::text, '{}'),
			COALESCE(TO_CHAR(meta_updated_at, 'YYYY-MM-DD HH24:MI:SS'), ''),

			TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
			TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
		FROM champions
		` + where + `
		` + orderBy + `
		LIMIT $` + strconv.Itoa(paramIndex) + `
		OFFSET $` + strconv.Itoa(paramIndex+1)

	args = append(args, limit, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Erro ao buscar pool de campeões: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	champions := []models.Champion{}

	for rows.Next() {
		var champion models.Champion

		err := rows.Scan(
			&champion.ID,
			&champion.Nome,
			&champion.Maestria,
			&champion.Lane,
			&champion.Prioridade,
			&champion.Status,
			&champion.Notes,
			&champion.RiotDifficulty,

			&champion.MetaStatus,
			&champion.MetaRankPosition,
			&champion.MetaWinRate,
			&champion.MetaPickRate,
			&champion.MetaBuildJSON,
			&champion.MetaUpdatedAt,

			&champion.CreatedAt,
			&champion.UpdatedAt,
		)

		if err != nil {
			http.Error(w, "Erro ao ler campeão do pool: "+err.Error(), http.StatusInternalServerError)
			return
		}

		champions = append(champions, champion)
	}

	totalPaginas := int(math.Ceil(float64(total) / float64(limit)))
	if totalPaginas == 0 {
		totalPaginas = 1
	}

	resposta := models.ChampionResponse{
		Dados:        champions,
		Pagina:       page,
		Limite:       limit,
		Total:        total,
		TotalPaginas: totalPaginas,
	}

	json.NewEncoder(w).Encode(resposta)
}

func cadastrarChampion(w http.ResponseWriter, r *http.Request, userID int) {
	var champion models.Champion

	err := json.NewDecoder(r.Body).Decode(&champion)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	normalizarChampionPool(&champion)

	if champion.Nome == "" {
		http.Error(w, "Nome é obrigatório", http.StatusBadRequest)
		return
	}

	err = database.DB.QueryRow(
		`
		INSERT INTO champions (
			nome,
			maestria,
			user_id,
			lane,
			prioridade,
			status,
			notes,
			riot_difficulty,
			meta_status,
			meta_rank_position,
			meta_win_rate,
			meta_pick_rate,
			meta_build_json,
			updated_at
		)
		VALUES ($1, 0, $2, $3, $4, $5, $6, $7, 'Não analisado', 0, 0, 0, '{}'::jsonb, CURRENT_TIMESTAMP)
		RETURNING
			id,
			nome,
			COALESCE(maestria, 0),
			COALESCE(lane, 'Mid'),
			COALESCE(prioridade, 'Testando'),
			COALESCE(status, 'Quero aprender'),
			COALESCE(notes, ''),
			COALESCE(riot_difficulty, 0),

			COALESCE(meta_status, 'Não analisado'),
			COALESCE(meta_rank_position, 0),
			COALESCE(meta_win_rate, 0),
			COALESCE(meta_pick_rate, 0),
			COALESCE(meta_build_json::text, '{}'),
			COALESCE(TO_CHAR(meta_updated_at, 'YYYY-MM-DD HH24:MI:SS'), ''),

			TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
			TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
		`,
		champion.Nome,
		userID,
		champion.Lane,
		champion.Prioridade,
		champion.Status,
		champion.Notes,
		champion.RiotDifficulty,
	).Scan(
		&champion.ID,
		&champion.Nome,
		&champion.Maestria,
		&champion.Lane,
		&champion.Prioridade,
		&champion.Status,
		&champion.Notes,
		&champion.RiotDifficulty,

		&champion.MetaStatus,
		&champion.MetaRankPosition,
		&champion.MetaWinRate,
		&champion.MetaPickRate,
		&champion.MetaBuildJSON,
		&champion.MetaUpdatedAt,

		&champion.CreatedAt,
		&champion.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "Erro ao adicionar campeão ao pool: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(champion)
}

func editarChampion(w http.ResponseWriter, r *http.Request, id int, userID int) {
	var champion models.Champion

	err := json.NewDecoder(r.Body).Decode(&champion)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	normalizarChampionPool(&champion)

	if champion.Nome == "" {
		http.Error(w, "Nome é obrigatório", http.StatusBadRequest)
		return
	}

	err = database.DB.QueryRow(
		`
		UPDATE champions
		SET
			nome = $1,
			lane = $2,
			prioridade = $3,
			status = $4,
			notes = $5,
			riot_difficulty = $6,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $7 AND user_id = $8
		RETURNING
			id,
			nome,
			COALESCE(maestria, 0),
			COALESCE(lane, 'Mid'),
			COALESCE(prioridade, 'Testando'),
			COALESCE(status, 'Quero aprender'),
			COALESCE(notes, ''),
			COALESCE(riot_difficulty, 0),

			COALESCE(meta_status, 'Não analisado'),
			COALESCE(meta_rank_position, 0),
			COALESCE(meta_win_rate, 0),
			COALESCE(meta_pick_rate, 0),
			COALESCE(meta_build_json::text, '{}'),
			COALESCE(TO_CHAR(meta_updated_at, 'YYYY-MM-DD HH24:MI:SS'), ''),

			TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
			TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
		`,
		champion.Nome,
		champion.Lane,
		champion.Prioridade,
		champion.Status,
		champion.Notes,
		champion.RiotDifficulty,
		id,
		userID,
	).Scan(
		&champion.ID,
		&champion.Nome,
		&champion.Maestria,
		&champion.Lane,
		&champion.Prioridade,
		&champion.Status,
		&champion.Notes,
		&champion.RiotDifficulty,

		&champion.MetaStatus,
		&champion.MetaRankPosition,
		&champion.MetaWinRate,
		&champion.MetaPickRate,
		&champion.MetaBuildJSON,
		&champion.MetaUpdatedAt,

		&champion.CreatedAt,
		&champion.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "Campeão não encontrado para este usuário ou erro ao editar: "+err.Error(), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(champion)
}

func excluirChampion(w http.ResponseWriter, r *http.Request, id int, userID int) {
	resultado, err := database.DB.Exec(
		`
		DELETE FROM champions
		WHERE id = $1 AND user_id = $2
		`,
		id,
		userID,
	)

	if err != nil {
		http.Error(w, "Erro ao excluir campeão do pool: "+err.Error(), http.StatusInternalServerError)
		return
	}

	linhasAfetadas, err := resultado.RowsAffected()
	if err != nil {
		http.Error(w, "Erro ao confirmar exclusão", http.StatusInternalServerError)
		return
	}

	if linhasAfetadas == 0 {
		http.Error(w, "Campeão não encontrado para este usuário", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func normalizarChampionPool(champion *models.Champion) {
	champion.Nome = strings.TrimSpace(champion.Nome)
	champion.Lane = strings.TrimSpace(champion.Lane)
	champion.Prioridade = strings.TrimSpace(champion.Prioridade)
	champion.Status = strings.TrimSpace(champion.Status)
	champion.Notes = strings.TrimSpace(champion.Notes)

	if champion.Lane == "" {
		champion.Lane = "Mid"
	}

	if champion.Prioridade == "" {
		champion.Prioridade = "Testando"
	}

	if champion.Status == "" {
		champion.Status = "Quero aprender"
	}

	if champion.RiotDifficulty < 0 {
		champion.RiotDifficulty = 0
	}

	if champion.RiotDifficulty > 10 {
		champion.RiotDifficulty = 10
	}

}
func ChampionMetaByIDHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(w)
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPut {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		http.Error(w, "Usuário não autenticado", http.StatusUnauthorized)
		return
	}

	idTexto := strings.TrimPrefix(r.URL.Path, "/champions/")
	idTexto = strings.TrimSuffix(idTexto, "/meta")

	id, err := strconv.Atoi(idTexto)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	var request models.SaveChampionMetaRequest

	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	request.MetaStatus = strings.TrimSpace(request.MetaStatus)
	request.MetaBuildJSON = strings.TrimSpace(request.MetaBuildJSON)

	if request.MetaStatus == "" {
		request.MetaStatus = "Não analisado"
	}

	if request.MetaBuildJSON == "" {
		request.MetaBuildJSON = "{}"
	}

	if request.MetaRankPosition < 0 {
		request.MetaRankPosition = 0
	}

	if request.MetaWinRate < 0 {
		request.MetaWinRate = 0
	}

	if request.MetaPickRate < 0 {
		request.MetaPickRate = 0
	}

	resultado, err := database.DB.Exec(
		`
		UPDATE champions
		SET
			meta_status = $1,
			meta_rank_position = $2,
			meta_win_rate = $3,
			meta_pick_rate = $4,
			meta_build_json = $5::jsonb,
			meta_updated_at = CURRENT_TIMESTAMP,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $6 AND user_id = $7
		`,
		request.MetaStatus,
		request.MetaRankPosition,
		request.MetaWinRate,
		request.MetaPickRate,
		request.MetaBuildJSON,
		id,
		userID,
	)

	if err != nil {
		http.Error(w, "Erro ao salvar meta: "+err.Error(), http.StatusInternalServerError)
		return
	}

	linhasAfetadas, err := resultado.RowsAffected()
	if err != nil {
		http.Error(w, "Erro ao confirmar atualização da meta", http.StatusInternalServerError)
		return
	}

	if linhasAfetadas == 0 {
		http.Error(w, "Campeão não encontrado para este usuário", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Meta salva com sucesso",
	})
}