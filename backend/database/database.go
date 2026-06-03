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

	createChampionsTableSQL := `
	CREATE TABLE IF NOT EXISTS champions (
		id SERIAL PRIMARY KEY,
		nome TEXT NOT NULL,
		maestria BIGINT NOT NULL DEFAULT 0,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		lane TEXT DEFAULT 'Mid',
		prioridade TEXT DEFAULT 'Testando',
		status TEXT DEFAULT 'Quero aprender',
		notes TEXT DEFAULT '',
		riot_difficulty INTEGER DEFAULT 0,
		meta_status TEXT DEFAULT 'Não analisado',
		meta_rank_position INTEGER DEFAULT 0,
		meta_win_rate NUMERIC DEFAULT 0,
		meta_pick_rate NUMERIC DEFAULT 0,
		meta_build_json JSONB DEFAULT '{}'::jsonb,
		meta_updated_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(createChampionsTableSQL)
	if err != nil {
		log.Fatal("Erro ao criar tabela champions:", err)
	}

	migrateChampionsTableSQL := `
	ALTER TABLE champions
	ADD COLUMN IF NOT EXISTS maestria BIGINT DEFAULT 0,
	ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
	ADD COLUMN IF NOT EXISTS lane TEXT DEFAULT 'Mid',
	ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'Testando',
	ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Quero aprender',
	ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
	ADD COLUMN IF NOT EXISTS riot_difficulty INTEGER DEFAULT 0,
	ADD COLUMN IF NOT EXISTS meta_status TEXT DEFAULT 'Não analisado',
	ADD COLUMN IF NOT EXISTS meta_rank_position INTEGER DEFAULT 0,
	ADD COLUMN IF NOT EXISTS meta_win_rate NUMERIC DEFAULT 0,
	ADD COLUMN IF NOT EXISTS meta_pick_rate NUMERIC DEFAULT 0,
	ADD COLUMN IF NOT EXISTS meta_build_json JSONB DEFAULT '{}'::jsonb,
	ADD COLUMN IF NOT EXISTS meta_updated_at TIMESTAMP,
	ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
	`

	_, err = DB.Exec(migrateChampionsTableSQL)
	if err != nil {
		log.Fatal("Erro ao atualizar tabela champions:", err)
	}

	updateOldChampionsSQL := `
	UPDATE champions
	SET
		maestria = COALESCE(maestria, 0),
		created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
		updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP),
		lane = COALESCE(lane, 'Mid'),
		prioridade = COALESCE(prioridade, 'Testando'),
		status = COALESCE(status, 'Quero aprender'),
		notes = COALESCE(notes, ''),
		riot_difficulty = COALESCE(riot_difficulty, 0),
		meta_status = COALESCE(meta_status, 'Não analisado'),
		meta_rank_position = COALESCE(meta_rank_position, 0),
		meta_win_rate = COALESCE(meta_win_rate, 0),
		meta_pick_rate = COALESCE(meta_pick_rate, 0),
		meta_build_json = COALESCE(meta_build_json, '{}'::jsonb);
	`

	_, err = DB.Exec(updateOldChampionsSQL)
	if err != nil {
		log.Fatal("Erro ao atualizar dados antigos da tabela champions:", err)
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

	createPushSubscriptionsTableSQL := `
	CREATE TABLE IF NOT EXISTS push_subscriptions (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		endpoint TEXT NOT NULL UNIQUE,
		p256dh TEXT NOT NULL,
		auth TEXT NOT NULL,
		user_agent TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(createPushSubscriptionsTableSQL)
	if err != nil {
		log.Fatal("Erro ao criar tabela push_subscriptions:", err)
	}

	log.Println("PostgreSQL conectado e tabelas atualizadas com sucesso!")
}
