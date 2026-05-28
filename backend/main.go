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

	http.HandleFunc("/users/search", handlers.AuthMiddleware(handlers.SearchUsersHandler))

	http.HandleFunc("/friends", handlers.AuthMiddleware(handlers.ListFriendsHandler))
	http.HandleFunc("/friends/", handlers.AuthMiddleware(handlers.RemoveFriendHandler))
	http.HandleFunc("/friends/request", handlers.AuthMiddleware(handlers.SendFriendRequestHandler))
	http.HandleFunc("/friends/requests", handlers.AuthMiddleware(handlers.ListFriendRequestsHandler))
	http.HandleFunc("/friends/accept", handlers.AuthMiddleware(handlers.AcceptFriendRequestHandler))
	http.HandleFunc("/friends/reject", handlers.AuthMiddleware(handlers.RejectFriendRequestHandler))

	http.HandleFunc("/chat/messages", handlers.AuthMiddleware(handlers.SendMessageHandler))
	http.HandleFunc("/chat/messages/", handlers.AuthMiddleware(handlers.ListMessagesHandler))

	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/champions", handlers.AuthMiddleware(handlers.ChampionsHandler))
	http.HandleFunc("/champions/", handlers.AuthMiddleware(handlers.ChampionByIDHandler))

	http.HandleFunc("/auth/register", handlers.RegisterHandler)
	http.HandleFunc("/auth/login", handlers.LoginHandler)
	//http.HandleFunc("/riot/link", handlers.AuthMiddleware(handlers.RiotLinkHandler))
	http.HandleFunc("/riot/profile", handlers.AuthMiddleware(handlers.RiotProfileHandler))
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