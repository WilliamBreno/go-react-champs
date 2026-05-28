package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"projeto-go-react/database"
	"projeto-go-react/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func gerarToken(user models.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "segredo_temporario_dev"
	}

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(24 * time.Hour * 7).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(secret))
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
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

	var request models.RegisterRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	request.Name = strings.TrimSpace(request.Name)
	request.Email = strings.TrimSpace(strings.ToLower(request.Email))

	if request.Name == "" || request.Email == "" || request.Password == "" {
		http.Error(w, "Nome, email e senha são obrigatórios", http.StatusBadRequest)
		return
	}

	if len(request.Password) < 6 {
		http.Error(w, "A senha precisa ter pelo menos 6 caracteres", http.StatusBadRequest)
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Erro ao criptografar senha", http.StatusInternalServerError)
		return
	}

	var user models.User

	err = database.DB.QueryRow(
		`INSERT INTO users (name, email, password_hash)
		 VALUES ($1, $2, $3)
		 RETURNING id, name, email`,
		request.Name,
		request.Email,
		string(passwordHash),
	).Scan(&user.ID, &user.Name, &user.Email)

	if err != nil {
		http.Error(w, "Erro ao cadastrar usuário. Talvez esse email já exista.", http.StatusInternalServerError)
		return
	}

	token, err := gerarToken(user)
	if err != nil {
		http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
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

	var request models.LoginRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	request.Email = strings.TrimSpace(strings.ToLower(request.Email))

	var user models.User

	err = database.DB.QueryRow(
		`SELECT id, name, email, password_hash
		 FROM users
		 WHERE email = $1`,
		request.Email,
	).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash)

	if err != nil {
		http.Error(w, "Email ou senha inválidos", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(request.Password))
	if err != nil {
		http.Error(w, "Email ou senha inválidos", http.StatusUnauthorized)
		return
	}

	token, err := gerarToken(user)
	if err != nil {
		http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
		return
	}

	database.DB.Exec(
		"UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = $1",
		user.ID,
	)

	json.NewEncoder(w).Encode(models.AuthResponse{
		Token: token,
		User:  user,
	})
}