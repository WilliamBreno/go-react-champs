package models

type PublicUser struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Friendship struct {
	ID          int        `json:"id"`
	RequesterID int       `json:"requesterId"`
	ReceiverID  int       `json:"receiverId"`
	Status      string    `json:"status"`
	User        PublicUser `json:"user"`
}

type FriendRequest struct {
	ReceiverID int `json:"receiverId"`
}

type FriendshipActionRequest struct {
	FriendshipID int `json:"friendshipId"`
}