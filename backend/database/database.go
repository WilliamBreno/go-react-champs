package database

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var DB *sql.DB

func InitDatabase() {
	var err error

	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL não encontrada nas variáveis de ambiente")
	}

	DB, err = sql.Open("pgx", databaseURL)
	if err != nil {
		log.Fatal("Erro ao conectar no PostgreSQL:", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatal("Erro ao testar conexão com PostgreSQL:", err)
	}

	createTableSQL := `
	CREATE TABLE IF NOT EXISTS champions (
		id SERIAL PRIMARY KEY,
		nome TEXT NOT NULL,
		maestria BIGINT NOT NULL,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
	);`

	_, err = DB.Exec(createTableSQL)
	if err != nil {
		log.Fatal("Erro ao criar tabela:", err)
	}

	log.Println("PostgreSQL conectado com sucesso!")

	createUsersTableSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(createUsersTableSQL)
	if err != nil {
		log.Fatal("Erro ao criar tabela users:", err)
	}
	createRiotAccountsTableSQL := `
	CREATE TABLE IF NOT EXISTS riot_accounts (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		game_name TEXT NOT NULL,
		tag_line TEXT NOT NULL,
		region TEXT NOT NULL,
		puuid TEXT NOT NULL,
		summoner_id TEXT,
		profile_icon_id INTEGER,
		summoner_level BIGINT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id)
	);`

	_, err = DB.Exec(createRiotAccountsTableSQL)
	if err != nil {
		log.Fatal("Erro ao criar tabela riot_accounts:", err)
	}
	createFriendshipsTableSQL := `
	CREATE TABLE IF NOT EXISTS friendships (
		id SERIAL PRIMARY KEY,
		requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		status TEXT NOT NULL DEFAULT 'pending',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		CONSTRAINT no_self_friendship CHECK (requester_id <> receiver_id),
		CONSTRAINT unique_friendship_pair UNIQUE (requester_id, receiver_id)
	);`

	_, err = DB.Exec(createFriendshipsTableSQL)
	if err != nil {
		log.Fatal("Erro ao criar tabela friendships:", err)
	}
	createMessagesTableSQL := `
	CREATE TABLE IF NOT EXISTS messages (
		id SERIAL PRIMARY KEY,
		friendship_id INTEGER NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
		sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		content TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(createMessagesTableSQL)
	if err != nil {
		log.Fatal("Erro ao criar tabela messages:", err)
	}
}
