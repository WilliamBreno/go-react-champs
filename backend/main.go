package main

import (
	"log"
	"net/http"
	"os"

	"projeto-go-react/database"
	"projeto-go-react/handlers"
)

func homeHandler(w http.ResponseWriter, r *http.Request) {
	handlers.EnableCors(w)
	w.Write([]byte("API Go com SQLite funcionando!"))
}

func main() {
	database.InitDatabase()
	defer database.DB.Close()

	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/champions", handlers.ChampionsHandler)
	http.HandleFunc("/champions/", handlers.ChampionByIDHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Servidor rodando na porta " + port)

	err := http.ListenAndServe("0.0.0.0:"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}