package database

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDatabase() {
	var err error

	DB, err = sql.Open("sqlite", "database.db")
	if err != nil {
		log.Fatal("Erro ao conectar no banco:", err)
	}

	createTableSQL := `
	CREATE TABLE IF NOT EXISTS champions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nome TEXT NOT NULL,
		maestria REAL NOT NULL
	);`

	_, err = DB.Exec(createTableSQL)
	if err != nil {
		log.Fatal("Erro ao criar tabela:", err)
	}

	log.Println("Banco de dados conectado com sucesso!")
}