package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"projeto-go-react/database"
	"projeto-go-react/models"
)

func SearchUsersHandler(w http.ResponseWriter, r *http.Request) {
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

	query := strings.TrimSpace(r.URL.Query().Get("query"))

	if query == "" {
		json.NewEncoder(w).Encode([]models.PublicUser{})
		return
	}

	rows, err := database.DB.Query(
		`
		SELECT
			id,
			name,
			email,
			CASE
				WHEN last_seen_at >= NOW() - INTERVAL '2 minutes'
				THEN true
				ELSE false
			END AS is_online,
			TO_CHAR(last_seen_at, 'YYYY-MM-DD HH24:MI:SS') AS last_seen_at
		FROM users
		WHERE id <> $1
		AND (
			name ILIKE $2
			OR email ILIKE $2
		)
		ORDER BY is_online DESC, name ASC
		LIMIT 10
		`,
		userID,
		"%"+query+"%",
	)

	if err != nil {
		http.Error(w, "Erro ao buscar usuários: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []models.PublicUser{}

	for rows.Next() {
		var user models.PublicUser

		err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.IsOnline, &user.LastSeenAt,)
		if err != nil {
			http.Error(w, "Erro ao ler usuário: "+err.Error(), http.StatusInternalServerError)
			return
		}

		users = append(users, user)
	}

	json.NewEncoder(w).Encode(users)
}

func SendFriendRequestHandler(w http.ResponseWriter, r *http.Request) {
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

	var request models.FriendRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if request.ReceiverID <= 0 {
		http.Error(w, "Usuário de destino inválido", http.StatusBadRequest)
		return
	}

	if request.ReceiverID == userID {
		http.Error(w, "Você não pode adicionar a si mesmo", http.StatusBadRequest)
		return
	}

	var receiverExists bool

	err = database.DB.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)`,
		request.ReceiverID,
	).Scan(&receiverExists)

	if err != nil {
		http.Error(w, "Erro ao verificar usuário", http.StatusInternalServerError)
		return
	}

	if !receiverExists {
		http.Error(w, "Usuário não encontrado", http.StatusNotFound)
		return
	}

	var existingStatus string

	err = database.DB.QueryRow(
		`
		SELECT status
		FROM friendships
		WHERE
			(requester_id = $1 AND receiver_id = $2)
			OR
			(requester_id = $2 AND receiver_id = $1)
		LIMIT 1
		`,
		userID,
		request.ReceiverID,
	).Scan(&existingStatus)

	if err == nil {
		if existingStatus == "accepted" {
			http.Error(w, "Vocês já são amigos", http.StatusBadRequest)
			return
		}

		if existingStatus == "pending" {
			http.Error(w, "Já existe uma solicitação pendente", http.StatusBadRequest)
			return
		}

		if existingStatus == "rejected" {
			_, err = database.DB.Exec(
				`
				UPDATE friendships
				SET requester_id = $1,
					receiver_id = $2,
					status = 'pending',
					updated_at = CURRENT_TIMESTAMP
				WHERE
					(requester_id = $1 AND receiver_id = $2)
					OR
					(requester_id = $2 AND receiver_id = $1)
				`,
				userID,
				request.ReceiverID,
			)

			if err != nil {
				http.Error(w, "Erro ao reenviar solicitação: "+err.Error(), http.StatusInternalServerError)
				return
			}

			json.NewEncoder(w).Encode(map[string]string{
				"message": "Solicitação reenviada com sucesso",
			})
			return
		}
	}

	_, err = database.DB.Exec(
		`
		INSERT INTO friendships (requester_id, receiver_id, status)
		VALUES ($1, $2, 'pending')
		`,
		userID,
		request.ReceiverID,
	)

	if err != nil {
		http.Error(w, "Erro ao enviar solicitação: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Solicitação enviada com sucesso",
	})
}

func ListFriendsHandler(w http.ResponseWriter, r *http.Request) {
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

	rows, err := database.DB.Query(
		`
		SELECT
			f.id,
			f.requester_id,
			f.receiver_id,
			f.status,
			u.id,
			u.name,
			u.email,
			CASE
				WHEN u.last_seen_at >= NOW() - INTERVAL '2 minutes'
				THEN true
				ELSE false
			END AS is_online,
			TO_CHAR(u.last_seen_at, 'YYYY-MM-DD HH24:MI:SS') AS last_seen_at
		FROM friendships f
		JOIN users u
			ON u.id = CASE
				WHEN f.requester_id = $1 THEN f.receiver_id
				ELSE f.requester_id
			END
		WHERE
			(f.requester_id = $1 OR f.receiver_id = $1)
			AND f.status = 'accepted'
		ORDER BY is_online DESC, u.name ASC
		`,
		userID,
	)

	if err != nil {
		http.Error(w, "Erro ao listar amigos: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	friends := []models.Friendship{}

	for rows.Next() {
		var friendship models.Friendship

		err := rows.Scan(
			&friendship.ID,
			&friendship.RequesterID,
			&friendship.ReceiverID,
			&friendship.Status,
			&friendship.User.ID,
			&friendship.User.Name,
			&friendship.User.Email,
			&friendship.User.IsOnline,
			&friendship.User.LastSeenAt,
		)

		if err != nil {
			http.Error(w, "Erro ao ler amigo: "+err.Error(), http.StatusInternalServerError)
			return
		}

		friends = append(friends, friendship)
	}

	json.NewEncoder(w).Encode(friends)
}

func ListFriendRequestsHandler(w http.ResponseWriter, r *http.Request) {
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

	rows, err := database.DB.Query(
		`
		SELECT
			f.id,
			f.requester_id,
			f.receiver_id,
			f.status,
			u.id,
			u.name,
			u.email,
			CASE
				WHEN u.last_seen_at >= NOW() - INTERVAL '2 minutes'
				THEN true
				ELSE false
			END AS is_online,
			TO_CHAR(u.last_seen_at, 'YYYY-MM-DD HH24:MI:SS') AS last_seen_at
		FROM friendships f
		JOIN users u ON u.id = f.requester_id
		WHERE f.receiver_id = $1
		AND f.status = 'pending'
		ORDER BY f.created_at DESC
		`,
		userID,
	)

	if err != nil {
		http.Error(w, "Erro ao listar solicitações: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	requests := []models.Friendship{}

	for rows.Next() {
		var friendship models.Friendship

		err := rows.Scan(
			&friendship.ID,
			&friendship.RequesterID,
			&friendship.ReceiverID,
			&friendship.Status,
			&friendship.User.ID,
			&friendship.User.Name,
			&friendship.User.Email,
			&friendship.User.IsOnline,
			&friendship.User.LastSeenAt,
		)

		if err != nil {
			http.Error(w, "Erro ao ler solicitação: "+err.Error(), http.StatusInternalServerError)
			return
		}

		requests = append(requests, friendship)
	}

	json.NewEncoder(w).Encode(requests)
}

func AcceptFriendRequestHandler(w http.ResponseWriter, r *http.Request) {
	updateFriendRequestStatus(w, r, "accepted")
}

func RejectFriendRequestHandler(w http.ResponseWriter, r *http.Request) {
	updateFriendRequestStatus(w, r, "rejected")
}

func updateFriendRequestStatus(w http.ResponseWriter, r *http.Request, status string) {
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

	var request models.FriendshipActionRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if request.FriendshipID <= 0 {
		http.Error(w, "Solicitação inválida", http.StatusBadRequest)
		return
	}

	resultado, err := database.DB.Exec(
		`
		UPDATE friendships
		SET status = $1,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
		AND receiver_id = $3
		AND status = 'pending'
		`,
		status,
		request.FriendshipID,
		userID,
	)

	if err != nil {
		http.Error(w, "Erro ao atualizar solicitação: "+err.Error(), http.StatusInternalServerError)
		return
	}

	linhasAfetadas, err := resultado.RowsAffected()
	if err != nil {
		http.Error(w, "Erro ao confirmar atualização", http.StatusInternalServerError)
		return
	}

	if linhasAfetadas == 0 {
		http.Error(w, "Solicitação não encontrada", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Solicitação atualizada com sucesso",
	})
}

func RemoveFriendHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(w)
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodDelete {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		http.Error(w, "Usuário não autenticado", http.StatusUnauthorized)
		return
	}

	idTexto := strings.TrimPrefix(r.URL.Path, "/friends/")
	friendshipID, err := strconv.Atoi(idTexto)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	resultado, err := database.DB.Exec(
		`
		DELETE FROM friendships
		WHERE id = $1
		AND (requester_id = $2 OR receiver_id = $2)
		`,
		friendshipID,
		userID,
	)

	if err != nil {
		http.Error(w, "Erro ao remover amigo: "+err.Error(), http.StatusInternalServerError)
		return
	}

	linhasAfetadas, err := resultado.RowsAffected()
	if err != nil {
		http.Error(w, "Erro ao confirmar remoção", http.StatusInternalServerError)
		return
	}

	if linhasAfetadas == 0 {
		http.Error(w, "Amizade não encontrada", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}