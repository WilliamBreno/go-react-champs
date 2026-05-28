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

	orderBy := "ORDER BY id DESC"

	switch ordem {
	case "maior_maestria":
		orderBy = "ORDER BY maestria DESC"

	case "menor_maestria":
		orderBy = "ORDER BY maestria ASC"

	case "nome_az":
		orderBy = "ORDER BY nome ASC"

	case "nome_za":
		orderBy = "ORDER BY nome DESC"

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
		SELECT id, nome, maestria
		FROM champions
		` + where + `
		` + orderBy + `
		LIMIT $` + strconv.Itoa(paramIndex) + `
		OFFSET $` + strconv.Itoa(paramIndex+1)

	args = append(args, limit, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Erro ao buscar campeões: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	champions := []models.Champion{}

	for rows.Next() {
		var champion models.Champion

		err := rows.Scan(&champion.ID, &champion.Nome, &champion.Maestria)
		if err != nil {
			http.Error(w, "Erro ao ler campeão: "+err.Error(), http.StatusInternalServerError)
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

	champion.Nome = strings.TrimSpace(champion.Nome)

	if champion.Nome == "" {
		http.Error(w, "Nome é obrigatório", http.StatusBadRequest)
		return
	}

	if champion.Maestria <= 0 {
		http.Error(w, "Maestria precisa ser maior que zero", http.StatusBadRequest)
		return
	}

	err = database.DB.QueryRow(
		`
		INSERT INTO champions (nome, maestria, user_id)
		VALUES ($1, $2, $3)
		RETURNING id, nome, maestria
		`,
		champion.Nome,
		champion.Maestria,
		userID,
	).Scan(&champion.ID, &champion.Nome, &champion.Maestria)

	if err != nil {
		http.Error(w, "Erro ao cadastrar campeão: "+err.Error(), http.StatusInternalServerError)
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

	champion.Nome = strings.TrimSpace(champion.Nome)

	if champion.Nome == "" {
		http.Error(w, "Nome é obrigatório", http.StatusBadRequest)
		return
	}

	if champion.Maestria <= 0 {
		http.Error(w, "Maestria precisa ser maior que zero", http.StatusBadRequest)
		return
	}

	resultado, err := database.DB.Exec(
		`
		UPDATE champions
		SET nome = $1, maestria = $2
		WHERE id = $3 AND user_id = $4
		`,
		champion.Nome,
		champion.Maestria,
		id,
		userID,
	)

	if err != nil {
		http.Error(w, "Erro ao editar campeão: "+err.Error(), http.StatusInternalServerError)
		return
	}

	linhasAfetadas, err := resultado.RowsAffected()
	if err != nil {
		http.Error(w, "Erro ao confirmar edição", http.StatusInternalServerError)
		return
	}

	if linhasAfetadas == 0 {
		http.Error(w, "Campeão não encontrado para este usuário", http.StatusNotFound)
		return
	}

	champion.ID = id

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
		http.Error(w, "Erro ao excluir campeão: "+err.Error(), http.StatusInternalServerError)
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