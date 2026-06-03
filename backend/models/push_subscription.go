package models

type PushKeys struct {
	P256dh string `json:"p256dh"`
	Auth   string `json:"auth"`
}

type PushSubscriptionRequest struct {
	Endpoint string   `json:"endpoint"`
	Keys     PushKeys `json:"keys"`
}