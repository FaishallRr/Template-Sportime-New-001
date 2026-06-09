package service

import (
	"database/sql"
	"fmt"
	"log"
)

type NotificationType string

const (
	NotifBookingConfirmation NotificationType = "booking_confirmation"
	NotifBookingReminder     NotificationType = "booking_reminder"
	NotifPaymentReceived     NotificationType = "payment_received"
	NotifPaymentExpired      NotificationType = "payment_expired"
)

func NotifyMitra(db *sql.DB, mitraUserID string, message string) {
	if mitraUserID == "" || message == "" {
		return
	}

	_, err := db.Exec(`
		INSERT INTO notifications (user_id, message, is_read, created_at)
		VALUES ($1, $2, false, NOW())
	`, mitraUserID, message)
	if err != nil {
		log.Printf("[Notify] Failed to insert notification: %v", err)
		return
	}
	fmt.Printf("[Notify] Notification sent to mitra %s: %s\n", mitraUserID, message)
}

func NotifyAll(db *sql.DB, message string) {
	_, err := db.Exec(`
		INSERT INTO notifications (user_id, message, is_read, created_at)
		SELECT id, $1, false, NOW() FROM users WHERE role = 'mitra'
	`, message)
	if err != nil {
		log.Printf("[Notify] Failed to broadcast notification: %v", err)
	}
}

func NotifyMitraByBooking(db *sql.DB, bookingID string, message string) {
	if bookingID == "" || message == "" {
		return
	}
	_, err := db.Exec(`
		INSERT INTO notifications (user_id, message, is_read, created_at)
		SELECT u.id, $1, false, NOW()
		FROM bookings b
		JOIN venues v ON v.id = b.venue_id
		JOIN users u ON u.id = v.mitra_id
		WHERE b.id = $2
	`, message, bookingID)
	if err != nil {
		log.Printf("[Notify] Failed to insert notification: %v", err)
	}
}
