package service

import (
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

func SendWhatsAppMessage(target, message string, imageURL ...string) {
	apiKey := os.Getenv("FONNTE_TOKEN")
	if apiKey == "" || target == "" || message == "" {
		log.Println("[WhatsApp] Missing API key, target, or message")
		return
	}

	data := url.Values{}
	data.Set("target", target)
	data.Set("message", message)
	data.Set("countryCode", "62")

	if len(imageURL) > 0 && imageURL[0] != "" {
		data.Set("image", imageURL[0])
	}

	req, err := http.NewRequest("POST", "https://api.fonnte.com/send", strings.NewReader(data.Encode()))
	if err != nil {
		log.Printf("[WhatsApp] Failed to create request: %v", err)
		return
	}
	req.Header.Set("Authorization", apiKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[WhatsApp] Failed to send: %v", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("[WhatsApp] Message sent to %s (status: %d)", target, resp.StatusCode)
}
