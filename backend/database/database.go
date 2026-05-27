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
		maestria DOUBLE PRECISION NOT NULL
	);`

	_, err = DB.Exec(createTableSQL)
	if err != nil {
		log.Fatal("Erro ao criar tabela:", err)
	}

	log.Println("PostgreSQL conectado com sucesso!")
}