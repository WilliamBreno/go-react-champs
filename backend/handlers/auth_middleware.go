package handlers

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		EnableCors(w)

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		authHeader := r.Header.Get("Authorization")

		if authHeader == "" {
			http.Error(w, "Token não enviado", http.StatusUnauthorized)
			return
		}

		partes := strings.Split(authHeader, " ")

		if len(partes) != 2 || partes[0] != "Bearer" {
			http.Error(w, "Token inválido", http.StatusUnauthorized)
			return
		}

		tokenString := partes[1]

		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "segredo_temporario_dev"
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Token inválido", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Claims inválidas", http.StatusUnauthorized)
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			http.Error(w, "Usuário inválido no token", http.StatusUnauthorized)
			return
		}

		userID := int(userIDFloat)

		ctx := context.WithValue(r.Context(), UserIDKey, userID)

		next(w, r.WithContext(ctx))
	}
}

func GetUserIDFromRequest(r *http.Request) (int, bool) {
	userID, ok := r.Context().Value(UserIDKey).(int)
	return userID, ok
}