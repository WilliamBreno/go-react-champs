package main

import (
	"fmt"
	"log"

	webpush "github.com/SherClockHolmes/webpush-go"
)

func main() {
	privateKey, publicKey, err := webpush.GenerateVAPIDKeys()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("VAPID_PUBLIC_KEY=", publicKey)
	fmt.Println("VAPID_PRIVATE_KEY=", privateKey)
}