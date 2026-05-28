package models

type Message struct {
	ID           int    `json:"id"`
	FriendshipID int   `json:"friendshipId"`
	SenderID     int   `json:"senderId"`
	ReceiverID   int   `json:"receiverId"`
	Content      string `json:"content"`
	CreatedAt    string `json:"createdAt"`
	Sender       PublicUser `json:"sender"`
}

type SendMessageRequest struct {
	FriendshipID int    `json:"friendshipId"`
	Content      string `json:"content"`
}