package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/sportime/api/internal/config"
	"github.com/sportime/api/internal/database"
)

func main() {
	godotenv.Load()
	cfg := config.Load()
	db := database.Connect(&cfg.DB)
	defer db.Close()

	startMin := 6 * 60
	endMin := 22 * 60
	slotDuration := int64(60)

	mode := "all"
	if len(os.Args) > 1 {
		mode = os.Args[1]
	}

	var courtIDs []string

	if mode == "all" {
		rows, err := db.Query(`SELECT id FROM courts WHERE deleted_at IS NULL`)
		if err != nil {
			log.Fatalf("Query courts error: %v", err)
		}
		defer rows.Close()
		for rows.Next() {
			var id string
			rows.Scan(&id)
			courtIDs = append(courtIDs, id)
		}
		log.Printf("Found %d courts total", len(courtIDs))
	} else {
		rows, err := db.Query(`
			SELECT c.id FROM courts c
			JOIN venues v ON v.id = c.venue_id
			WHERE v.slug = $1 AND c.deleted_at IS NULL
		`, mode)
		if err != nil {
			log.Fatalf("Query error: %v", err)
		}
		defer rows.Close()
		for rows.Next() {
			var id string
			rows.Scan(&id)
			courtIDs = append(courtIDs, id)
		}
		if len(courtIDs) == 0 {
			log.Fatalf("No courts found for venue slug: %s", mode)
		}
		log.Printf("Found %d courts for venue %s", len(courtIDs), mode)
	}

	timeNow := time.Now()
	startDate := func() time.Time {
		if len(os.Args) > 2 && os.Args[2] == "--today" {
			return timeNow
		}
		return timeNow.AddDate(0, 0, 1)
	}()

	inserted := 0
	for _, cid := range courtIDs {
		for day := 0; day < 7; day++ {
			date := startDate.AddDate(0, 0, day).Format("2006-01-02")
			for t := startMin; t+int(slotDuration) <= endMin; t += int(slotDuration) {
				startH := t / 60
				startM := t % 60
				endT := t + int(slotDuration)
				endH := endT / 60
				endM := endT % 60
				startStr := fmt.Sprintf("%02d:%02d", startH, startM)
				endStr := fmt.Sprintf("%02d:%02d", endH, endM)

				_, err := db.Exec(
					`INSERT INTO slots (court_id, date, start_time, end_time, status, created_at)
					 VALUES ($1, $2, $3, $4, 'available', NOW())
					 ON CONFLICT (court_id, date, start_time) DO NOTHING`,
					cid, date, startStr, endStr,
				)
				if err != nil {
					log.Printf("Insert error (court=%s, date=%s, time=%s): %v", cid, date, startStr, err)
				} else {
					inserted++
				}
			}
		}
	}
	log.Printf("Done. Inserted %d slots.", inserted)
}


