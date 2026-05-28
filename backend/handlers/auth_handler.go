package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"projeto-go-react/database"
	"projeto-go-react/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)
func getRegionalRoute(region string) string {
	region = strings.ToLower(region)

	switch region {
	case "br1", "na1", "la1", "la2":
		return "americas"
	case "euw1", "eun1", "tr1", "ru":
		return "europe"
	case "kr", "jp1":
		return "asia"
	case "oc1":
		return "sea"
	default:
		return "americas"
	}
}
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

func buscarContaRiot(gameName string, tagLine string, region string) (models.RiotAccountAPIResponse, models.RiotSummonerAPIResponse, error) {
	riotAPIKey := os.Getenv("RIOT_API_KEY")
	if riotAPIKey == "" {
		return models.RiotAccountAPIResponse{}, models.RiotSummonerAPIResponse{}, fmt.Errorf("RIOT_API_KEY não configurada")
	}

	regionalRoute := getRegionalRoute(region)

	gameNameEscaped := url.PathEscape(gameName)
	tagLineEscaped := url.PathEscape(tagLine)

	accountURL := fmt.Sprintf(
		"https://%s.api.riotgames.com/riot/account/v1/accounts/by-riot-id/%s/%s",
		regionalRoute,
		gameNameEscaped,
		tagLineEscaped,
	)

	req, err := http.NewRequest(http.MethodGet, accountURL, nil)
	if err != nil {
		return models.RiotAccountAPIResponse{}, models.RiotSummonerAPIResponse{}, err
	}

	req.Header.Set("X-Riot-Token", riotAPIKey)

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return models.RiotAccountAPIResponse{}, models.RiotSummonerAPIResponse{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return models.RiotAccountAPIResponse{}, models.RiotSummonerAPIResponse{}, fmt.Errorf("conta Riot não encontrada")
	}

	var accountResponse models.RiotAccountAPIResponse

	err = json.NewDecoder(resp.Body).Decode(&accountResponse)
	if err != nil {
		return models.RiotAccountAPIResponse{}, models.RiotSummonerAPIResponse{}, err
	}

	summonerURL := fmt.Sprintf(
		"https://%s.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/%s",
		strings.ToLower(region),
		url.PathEscape(accountResponse.PUUID),
	)

	summonerReq, err := http.NewRequest(http.MethodGet, summonerURL, nil)
	if err != nil {
		return models.RiotAccountAPIResponse{}, models.RiotSummonerAPIResponse{}, err
	}

	summonerReq.Header.Set("X-Riot-Token", riotAPIKey)

	summonerResp, err := client.Do(summonerReq)
	if err != nil {
		return models.RiotAccountAPIResponse{}, models.RiotSummonerAPIResponse{}, err
	}
	defer summonerResp.Body.Close()

	if summonerResp.StatusCode != http.StatusOK {
		return models.RiotAccountAPIResponse{}, models.RiotSummonerAPIResponse{}, fmt.Errorf("dados do invocador não encontrados")
	}

	var summonerResponse models.RiotSummonerAPIResponse

	err = json.NewDecoder(summonerResp.Body).Decode(&summonerResponse)
	if err != nil {
		return models.RiotAccountAPIResponse{}, models.RiotSummonerAPIResponse{}, err
	}

	return accountResponse, summonerResponse, nil
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

	request.GameName = strings.TrimSpace(request.GameName)
	request.TagLine = strings.TrimSpace(strings.ToUpper(request.TagLine))
	request.Region = strings.ToLower(strings.TrimSpace(request.Region))
	request.Email = strings.TrimSpace(strings.ToLower(request.Email))

	if request.GameName == "" || request.TagLine == "" || request.Region == "" || request.Email == "" || request.Password == "" {
		http.Error(w, "Riot ID, Tagline, Região, email e senha são obrigatórios", http.StatusBadRequest)
		return
	}

	if len(request.Password) < 6 {
		http.Error(w, "A senha precisa ter pelo menos 6 caracteres", http.StatusBadRequest)
		return
	}

	accountResponse, summonerResponse, err := buscarContaRiot(
		request.GameName,
		request.TagLine,
		request.Region,
	)

	if err != nil {
		http.Error(w, "Não encontramos essa conta Riot. Confira o Riot ID, a Tagline e a região.", http.StatusBadRequest)
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Erro ao criptografar senha", http.StatusInternalServerError)
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Erro ao iniciar cadastro", http.StatusInternalServerError)
		return
	}

	defer tx.Rollback()

	var user models.User

	err = tx.QueryRow(
		`INSERT INTO users (name, email, password_hash)
		 VALUES ($1, $2, $3)
		 RETURNING id, name, email`,
		accountResponse.GameName,
		request.Email,
		string(passwordHash),
	).Scan(&user.ID, &user.Name, &user.Email)

	if err != nil {
		http.Error(w, "Erro ao cadastrar usuário. Talvez esse email já exista.", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(
		`
		INSERT INTO riot_accounts (
			user_id,
			game_name,
			tag_line,
			region,
			puuid,
			summoner_id,
			profile_icon_id,
			summoner_level,
			updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
		`,
		user.ID,
		accountResponse.GameName,
		accountResponse.TagLine,
		request.Region,
		accountResponse.PUUID,
		summonerResponse.ID,
		summonerResponse.ProfileIconID,
		summonerResponse.SummonerLevel,
	)

	if err != nil {
		http.Error(w, "Erro ao vincular conta Riot", http.StatusInternalServerError)
		return
	}

	err = tx.Commit()
	if err != nil {
		http.Error(w, "Erro ao finalizar cadastro", http.StatusInternalServerError)
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