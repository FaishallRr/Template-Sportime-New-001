package service

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"
)

type CronService struct {
	db              *sql.DB
	slotLockMinutes int
	quitFuncs       []func()
}

func NewCronService(db *sql.DB) *CronService {
	minutes := 10
	if v := os.Getenv("SLOT_LOCK_MINUTES"); v != "" {
		if n, err := fmt.Sscanf(v, "%d", &minutes); err != nil || n != 1 {
			minutes = 10
		}
	}
	return &CronService{
		db:              db,
		slotLockMinutes: minutes,
	}
}

func (s *CronService) Stop() {
	for _, quit := range s.quitFuncs {
		quit()
	}
}

func (s *CronService) StartExpiredBookingsChecker() {
	ticker := time.NewTicker(1 * time.Minute)
	s.quitFuncs = append(s.quitFuncs, func() { ticker.Stop() })
	go func() {
		for range ticker.C {
			s.processExpiredBookings()
		}
	}()
	log.Println("[Cron] Expired bookings checker started")
}

func (s *CronService) processExpiredBookings() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		log.Printf("[Cron] Failed to begin tx: %v", err)
		return
	}
	defer tx.Rollback()

	rows, err := tx.QueryContext(ctx, `
		SELECT id FROM bookings
		WHERE status = 'pending'
		AND created_at < NOW() - INTERVAL '1 day'
		FOR UPDATE SKIP LOCKED
	`)
	if err != nil {
		log.Printf("[Cron] Failed to query expired bookings: %v", err)
		return
	}
	var ids []string
	for rows.Next() {
		var id string
		rows.Scan(&id)
		ids = append(ids, id)
	}
	rows.Close()

	if len(ids) == 0 {
		return
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE bookings SET status = 'cancelled', cancelled_at = NOW()
		WHERE id = ANY($1)
	`, ids)
	if err != nil {
		log.Printf("[Cron] Failed to expire bookings: %v", err)
		return
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE slots SET status = 'available'
		WHERE id IN (SELECT slot_id FROM bookings WHERE id = ANY($1))
	`, ids)
	if err != nil {
		log.Printf("[Cron] Failed to release slots: %v", err)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("[Cron] Failed to commit: %v", err)
	}
}

func (s *CronService) StartBookingReminders() {
	ticker := time.NewTicker(30 * time.Minute)
	s.quitFuncs = append(s.quitFuncs, func() { ticker.Stop() })
	go func() {
		for range ticker.C {
			s.sendBookingReminders()
		}
	}()
	log.Println("[Cron] Booking reminders started")
}

func (s *CronService) sendBookingReminders() {
	reminders := []struct {
		label string
		hours int
	}{
		{"H-1 (tomorrow)", 24},
		{"H-2 (day after tomorrow)", 48},
	}
	for _, r := range reminders {
		rows, err := s.db.Query(`
			SELECT b.id, u.full_name, u.email, u.phone, v.name, sl.date, sl.start_time
			FROM bookings b
			JOIN users u ON u.id = b.user_id
			JOIN venues v ON v.id = b.venue_id
			JOIN slots sl ON sl.id = b.slot_id
			WHERE b.status = 'confirmed'
			AND sl.date = CURRENT_DATE + $1::interval
		`, fmt.Sprintf("%d hours", r.hours))
		if err != nil {
			log.Printf("[Cron] Query error for %s: %v", r.label, err)
			continue
		}
		for rows.Next() {
			var id, fullName, email, phone, venueName, slotDate, slotTime string
			if err := rows.Scan(&id, &fullName, &email, &phone, &venueName, &slotDate, &slotTime); err != nil {
				continue
			}
			log.Printf("[Cron] Reminder for %s (%s): %s at %s %s - %s", fullName, email, venueName, slotDate, slotTime, r.label)
		}
		rows.Close()
	}
}

func (s *CronService) StartDailyReports() {
	ticker := time.NewTicker(30 * time.Minute)
	s.quitFuncs = append(s.quitFuncs, func() { ticker.Stop() })
	go func() {
		for range ticker.C {
			s.sendDailyReports()
		}
	}()
	log.Println("[Cron] Daily reports started")
}

func (s *CronService) sendDailyReports() {
	now := time.Now()
	if now.Hour() != 8 || now.Minute() > 5 {
		return
	}

	rows, err := s.db.Query(`
		SELECT v.name, COUNT(b.id), COALESCE(SUM(b.gross_amount), 0)
		FROM bookings b
		JOIN venues v ON v.id = b.venue_id
		JOIN slots sl ON sl.id = b.slot_id
		WHERE sl.date = CURRENT_DATE AND b.status = 'confirmed'
		GROUP BY v.name
	`)
	if err != nil {
		log.Printf("[Cron] Daily report query error: %v", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var venueName string
		var count int
		var total float64
		if err := rows.Scan(&venueName, &count, &total); err != nil {
			continue
		}
		log.Printf("[Cron] Daily report - %s: %d bookings, total %.0f", venueName, count, total)
	}
}

func (s *CronService) StartSlotGenerator() {
	s.generateAllSlots()

	lastGen := time.Now().Truncate(24 * time.Hour)
	ticker := time.NewTicker(6 * time.Hour)
	s.quitFuncs = append(s.quitFuncs, func() { ticker.Stop() })

	go func() {
		for range ticker.C {
			today := time.Now().Truncate(24 * time.Hour)
			if today.After(lastGen) {
				s.generateAllSlots()
				lastGen = today
			}
		}
	}()
	log.Println("[Cron] Slot generator started")
}

func (s *CronService) generateAllSlots() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[SlotGen] Recovered from panic: %v", r)
		}
	}()

	startMin := 6 * 60
	endMin := 22 * 60
	slotDuration := int64(60)

	rows, err := s.db.Query(`SELECT id FROM venues WHERE status = 'active'`)
	if err != nil {
		log.Printf("[SlotGen] Query venues error: %v", err)
		return
	}
	defer rows.Close()

	tomorrow := time.Now().AddDate(0, 0, 1)
	total := 0

	for rows.Next() {
		var venueID string
		rows.Scan(&venueID)

		courtRows, err := s.db.Query(`SELECT id FROM courts WHERE venue_id = $1`, venueID)
		if err != nil {
			log.Printf("[SlotGen] Query courts error for venue %s: %v", venueID, err)
			continue
		}

		var courtIDs []string
		for courtRows.Next() {
			var cid string
			courtRows.Scan(&cid)
			courtIDs = append(courtIDs, cid)
		}
		courtRows.Close()

		for _, cid := range courtIDs {
			for day := 0; day < 7; day++ {
				date := tomorrow.AddDate(0, 0, day).Format("2006-01-02")
				for t := startMin; t+int(slotDuration) <= endMin; t += int(slotDuration) {
					startH := t / 60
					startM := t % 60
					endT := t + int(slotDuration)
					endH := endT / 60
					endM := endT % 60
					startStr := fmt.Sprintf("%02d:%02d", startH, startM)
					endStr := fmt.Sprintf("%02d:%02d", endH, endM)

					_, err := s.db.Exec(
						`INSERT INTO slots (court_id, date, start_time, end_time, status, created_at)
						 VALUES ($1, $2, $3, $4, 'available', NOW())
						 ON CONFLICT (court_id, date, start_time) DO NOTHING`,
						cid, date, startStr, endStr,
					)
					if err != nil {
						log.Printf("[SlotGen] Insert error (court=%s, date=%s, time=%s): %v", cid, date, startStr, err)
					} else {
						total++
					}
				}
			}
		}
	}

	log.Printf("[SlotGen] Generated %d new slots for next 7 days", total)
}

func (s *CronService) StartAll() {
	s.StartExpiredBookingsChecker()
	s.StartBookingReminders()
	s.StartDailyReports()
	s.StartSlotGenerator()
}

func ValidatePromoCode(code string, amount float64, minAmount float64) bool {
	if code == "" {
		return false
	}
	code = strings.ToUpper(code)
	if amount < minAmount {
		return false
	}
	return true
}
