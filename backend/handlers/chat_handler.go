package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"projeto-go-react/database"
	"projeto-go-react/models"
)

func ListMessagesHandler(w http.ResponseWriter, r *http.Request) {
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

	idTexto := strings.TrimPrefix(r.URL.Path, "/chat/messages/")
	friendshipID, err := strconv.Atoi(idTexto)
	if err != nil {
		http.Error(w, "ID da amizade inválido", http.StatusBadRequest)
		return
	}

	var pertenceAoUsuario bool

	err = database.DB.QueryRow(
		`
		SELECT EXISTS(
			SELECT 1
			FROM friendships
			WHERE id = $1
			AND status = 'accepted'
			AND (requester_id = $2 OR receiver_id = $2)
		)
		`,
		friendshipID,
		userID,
	).Scan(&pertenceAoUsuario)

	if err != nil {
		http.Error(w, "Erro ao verificar amizade", http.StatusInternalServerError)
		return
	}

	if !pertenceAoUsuario {
		http.Error(w, "Amizade não encontrada para este usuário", http.StatusForbidden)
		return
	}

	rows, err := database.DB.Query(
		`
		SELECT
			m.id,
			m.friendship_id,
			m.sender_id,
			m.receiver_id,
			m.content,
			TO_CHAR(m.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
			u.id,
			u.name,
			u.email
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		WHERE m.friendship_id = $1
		ORDER BY m.created_at ASC
		LIMIT 100
		`,
		friendshipID,
	)

	if err != nil {
		http.Error(w, "Erro ao buscar mensagens: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	messages := []models.Message{}

	for rows.Next() {
		var message models.Message

		err := rows.Scan(
			&message.ID,
			&message.FriendshipID,
			&message.SenderID,
			&message.ReceiverID,
			&message.Content,
			&message.CreatedAt,
			&message.Sender.ID,
			&message.Sender.Name,
			&message.Sender.Email,
		)

		if err != nil {
			http.Error(w, "Erro ao ler mensagem: "+err.Error(), http.StatusInternalServerError)
			return
		}

		messages = append(messages, message)
	}

	json.NewEncoder(w).Encode(messages)
}

func SendMessageHandler(w http.ResponseWriter, r *http.Request) {
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

	var request models.SendMessageRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	request.Content = strings.TrimSpace(request.Content)

	if request.FriendshipID <= 0 {
		http.Error(w, "Amizade inválida", http.StatusBadRequest)
		return
	}

	if request.Content == "" {
		http.Error(w, "Mensagem não pode estar vazia", http.StatusBadRequest)
		return
	}

	var receiverID int

	err = database.DB.QueryRow(
		`
		SELECT
			CASE
				WHEN requester_id = $1 THEN receiver_id
				ELSE requester_id
			END AS receiver_id
		FROM friendships
		WHERE id = $2
		AND status = 'accepted'
		AND (requester_id = $1 OR receiver_id = $1)
		`,
		userID,
		request.FriendshipID,
	).Scan(&receiverID)

	if err != nil {
		http.Error(w, "Amizade não encontrada para este usuário", http.StatusForbidden)
		return
	}

	var message models.Message

	err = database.DB.QueryRow(
		`
		INSERT INTO messages (friendship_id, sender_id, receiver_id, content)
		VALUES ($1, $2, $3, $4)
		RETURNING
			id,
			friendship_id,
			sender_id,
			receiver_id,
			content,
			TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
		`,
		request.FriendshipID,
		userID,
		receiverID,
		request.Content,
	).Scan(
		&message.ID,
		&message.FriendshipID,
		&message.SenderID,
		&message.ReceiverID,
		&message.Content,
		&message.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Erro ao enviar mensagem: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(message)
}