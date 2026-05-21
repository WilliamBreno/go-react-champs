package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"database/sql"

	"projeto-go-react/database"
	"projeto-go-react/models"
)

func EnableCors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func ListarChampions(w http.ResponseWriter, r *http.Request) {
	nomeBusca := r.URL.Query().Get("nome")
	ordem := r.URL.Query().Get("ordem")

	pageTexto := r.URL.Query().Get("page")
	limitTexto := r.URL.Query().Get("limit")

	page, err := strconv.Atoi(pageTexto)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitTexto)
	if err != nil || limit < 1 {
		limit = 5
	}

	offset := (page - 1) * limit

	orderBy := "id DESC"

	switch ordem {
	case "maior_maestria":
		orderBy = "maestria DESC"

	case "menor_maestria":
		orderBy = "maestria ASC"

	case "nome_az":
		orderBy = "nome ASC"

	case "nome_za":
		orderBy = "nome DESC"

	case "recentes":
		orderBy = "id DESC"

	default:
		orderBy = "id DESC"
	}

	var total int
	var rows *sql.Rows

	if strings.TrimSpace(nomeBusca) != "" {
		err = database.DB.QueryRow(
			"SELECT COUNT(*) FROM champions WHERE nome LIKE ?",
			"%"+nomeBusca+"%",
		).Scan(&total)

		if err != nil {
			http.Error(w, "Erro ao contar campeões", http.StatusInternalServerError)
			return
		}

		query := "SELECT id, nome, maestria FROM champions WHERE nome LIKE ? ORDER BY " + orderBy + " LIMIT ? OFFSET ?"

		rows, err = database.DB.Query(
			query,
			"%"+nomeBusca+"%",
			limit,
			offset,
		)
	} else {
		err = database.DB.QueryRow(
			"SELECT COUNT(*) FROM champions",
		).Scan(&total)

		if err != nil {
			http.Error(w, "Erro ao contar campeões", http.StatusInternalServerError)
			return
		}

		query := "SELECT id, nome, maestria FROM champions ORDER BY " + orderBy + " LIMIT ? OFFSET ?"

		rows, err = database.DB.Query(
			query,
			limit,
			offset,
		)
	}

	if err != nil {
		http.Error(w, "Erro ao buscar campeões", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	champions := []models.Champion{}

	for rows.Next() {
		var champion models.Champion

		err := rows.Scan(&champion.ID, &champion.Nome, &champion.Maestria)
		if err != nil {
			http.Error(w, "Erro ao ler campeão", http.StatusInternalServerError)
			return
		}

		champions = append(champions, champion)
	}

	totalPaginas := total / limit
	if total%limit != 0 {
		totalPaginas++
	}

	resposta := models.ChampionResponse{
		Dados:         champions,
		Pagina:        page,
		Limite:        limit,
		Total:         total,
		TotalPaginas:  totalPaginas,
	}

	json.NewEncoder(w).Encode(resposta)
}

func CadastrarChampion(w http.ResponseWriter, r *http.Request) {
	var novoChampion models.Champion

	err := json.NewDecoder(r.Body).Decode(&novoChampion)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(novoChampion.Nome) == "" {
		http.Error(w, "Nome é obrigatório", http.StatusBadRequest)
		return
	}

	if novoChampion.Maestria <= 0 {
		http.Error(w, "Maestria precisa ser maior que zero", http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec(
		"INSERT INTO champions (nome, maestria) VALUES (?, ?)",
		novoChampion.Nome,
		novoChampion.Maestria,
	)

	if err != nil {
		http.Error(w, "Erro ao cadastrar campeão", http.StatusInternalServerError)
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Erro ao obter ID", http.StatusInternalServerError)
		return
	}

	novoChampion.ID = int(id)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(novoChampion)
}

func EditarChampion(w http.ResponseWriter, r *http.Request) {
	idTexto := strings.TrimPrefix(r.URL.Path, "/champions/")
	id, err := strconv.Atoi(idTexto)

	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	var championAtualizado models.Champion

	err = json.NewDecoder(r.Body).Decode(&championAtualizado)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(championAtualizado.Nome) == "" {
		http.Error(w, "Nome é obrigatório", http.StatusBadRequest)
		return
	}

	if championAtualizado.Maestria <= 0 {
		http.Error(w, "Maestria precisa ser maior que zero", http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec(
		"UPDATE champions SET nome = ?, maestria = ? WHERE id = ?",
		championAtualizado.Nome,
		championAtualizado.Maestria,
		id,
	)

	if err != nil {
		http.Error(w, "Erro ao editar campeão", http.StatusInternalServerError)
		return
	}

	linhasAfetadas, err := result.RowsAffected()
	if err != nil {
		http.Error(w, "Erro ao verificar edição", http.StatusInternalServerError)
		return
	}

	if linhasAfetadas == 0 {
		http.Error(w, "Campeão não encontrado", http.StatusNotFound)
		return
	}

	championAtualizado.ID = id

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(championAtualizado)
}

func ExcluirChampion(w http.ResponseWriter, r *http.Request) {
	idTexto := strings.TrimPrefix(r.URL.Path, "/champions/")
	id, err := strconv.Atoi(idTexto)

	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec("DELETE FROM champions WHERE id = ?", id)
	if err != nil {
		http.Error(w, "Erro ao excluir campeão", http.StatusInternalServerError)
		return
	}

	linhasAfetadas, err := result.RowsAffected()
	if err != nil {
		http.Error(w, "Erro ao verificar exclusão", http.StatusInternalServerError)
		return
	}

	if linhasAfetadas == 0 {
		http.Error(w, "Campeão não encontrado", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func ChampionsHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(w)
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodGet:
		ListarChampions(w, r)

	case http.MethodPost:
		CadastrarChampion(w, r)

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

	switch r.Method {
	case http.MethodPut:
		EditarChampion(w, r)

	case http.MethodDelete:
		ExcluirChampion(w, r)

	default:
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
	}
}