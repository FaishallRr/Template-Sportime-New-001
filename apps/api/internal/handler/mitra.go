package handler

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/lib/pq"
	"github.com/sportime/api/internal/config"
	"github.com/sportime/api/internal/middleware"
	"github.com/sportime/api/internal/model"
)

var nonAlphaRegex = regexp.MustCompile(`[^a-zA-Z0-9\s-]`)
var multiSpaceRegex = regexp.MustCompile(`\s+`)
var multiDashRegex = regexp.MustCompile(`-+`)

func generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = nonAlphaRegex.ReplaceAllString(slug, "")
	slug = multiSpaceRegex.ReplaceAllString(slug, "-")
	slug = multiDashRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "venue"
	}
	return slug
}

func randomSuffix() string {
	return fmt.Sprintf("%06x", rand.Intn(0x1000000))
}

func formatStringArray(arr []string) string {
	if len(arr) == 0 {
		return "{}"
	}
	escaped := make([]string, len(arr))
	for i, s := range arr {
		escaped[i] = `"` + strings.ReplaceAll(s, `"`, `\"`) + `"`
	}
	return "{" + strings.Join(escaped, ",") + "}"
}

type MitraHandler struct {
	db  *sql.DB
	cfg *config.Config
}

func NewMitraHandler(db *sql.DB, cfg *config.Config) *MitraHandler {
	return &MitraHandler{db: db, cfg: cfg}
}

func (h *MitraHandler) ListVenues(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID

	rows, err := h.db.Query(`
		SELECT v.id, v.name, COALESCE(v.slug,''), v.address,
			v.latitude, v.longitude, v.description, v.facilities, v.image_urls,
			v.status, v.sport_type,
			COALESCE(v.rating_avg,0), COALESCE(v.review_count,0),
			v.created_at, v.updated_at,
			COALESCE(c.court_count,0), COALESCE(c.min_price,0),
			COALESCE(b.booking_count,0)
		FROM venues v
		LEFT JOIN (
			SELECT venue_id, COUNT(*) as court_count, MIN(price_per_hour) as min_price
			FROM courts GROUP BY venue_id
		) c ON c.venue_id = v.id
		LEFT JOIN (
			SELECT venue_id, COUNT(*) as booking_count
			FROM bookings WHERE status != 'cancelled' GROUP BY venue_id
		) b ON b.venue_id = v.id
		WHERE v.mitra_id = $1 AND v.deleted_at IS NULL ORDER BY v.created_at DESC
	`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data venue"})
		return
	}
	defer rows.Close()

	type mitraVenue struct {
		ID            string         `json:"id"`
		Name          string         `json:"name"`
		Slug          string         `json:"slug"`
		Address       string         `json:"address"`
		Latitude      float64        `json:"latitude"`
		Longitude     float64        `json:"longitude"`
		Description   string         `json:"description"`
		Facilities    pq.StringArray `json:"facilities"`
		ImageURLs     pq.StringArray `json:"image_urls"`
		Status        string         `json:"status"`
		SportType     string         `json:"sport_type"`
		RatingAvg     float64        `json:"rating_avg"`
		ReviewCount   int            `json:"review_count"`
		CreatedAt     time.Time      `json:"created_at"`
		UpdatedAt     time.Time      `json:"updated_at"`
		Distance      *float64       `json:"distance,omitempty"`
		CourtCount    int            `json:"court_count"`
		Price         int64          `json:"price"`
		TotalBookings int            `json:"total_bookings"`
	}

	var venues []mitraVenue
	for rows.Next() {
		var v mitraVenue
		if err := rows.Scan(&v.ID, &v.Name, &v.Slug, &v.Address, &v.Latitude,
			&v.Longitude, &v.Description, &v.Facilities, &v.ImageURLs,
			&v.Status, &v.SportType, &v.RatingAvg, &v.ReviewCount,
			&v.CreatedAt, &v.UpdatedAt,
			&v.CourtCount, &v.Price, &v.TotalBookings); err != nil {
			continue
		}
		venues = append(venues, v)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: venues})
}

func (h *MitraHandler) CreateVenue(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID

	var req struct {
		Name        string   `json:"name"`
		Address     string   `json:"address"`
		Latitude    float64  `json:"latitude"`
		Longitude   float64  `json:"longitude"`
		Description string   `json:"description"`
		Facilities  []string `json:"facilities"`
		ImageURLs   []string `json:"image_urls"`
		SportType   string   `json:"sport_type"`
		CourtCount  int      `json:"court_count"`
		Price       int64    `json:"price"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	slug := generateSlug(req.Name)
	uniqueSlug := slug
	for {
		var exists int
		h.db.QueryRow("SELECT COUNT(*) FROM venues WHERE slug = $1", uniqueSlug).Scan(&exists)
		if exists == 0 {
			break
		}
		uniqueSlug = slug + "-" + randomSuffix()
	}

	var venueID string
	err := h.db.QueryRow(`
		INSERT INTO venues (mitra_id, name, slug, address, latitude, longitude,
			description, facilities, image_urls, sport_type, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',NOW(),NOW())
		RETURNING id
	`, userID, req.Name, uniqueSlug, req.Address, req.Latitude, req.Longitude,
		req.Description, pq.StringArray(req.Facilities), pq.StringArray(req.ImageURLs),
		req.SportType).Scan(&venueID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal membuat venue"})
		return
	}

	if req.CourtCount > 0 {
		for i := 1; i <= req.CourtCount; i++ {
			courtName := fmt.Sprintf("Lapangan %d", i)
			_, err := h.db.Exec(`
				INSERT INTO courts (venue_id, name, price_per_hour, created_at)
				VALUES ($1,$2,$3,NOW())
			`, venueID, courtName, req.Price)
			if err != nil {
				continue
			}
		}
	}

	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: map[string]string{"id": venueID}})
}

func (h *MitraHandler) UpdateVenue(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	venueID := r.PathValue("id")

	var ownerID string
	err := h.db.QueryRow("SELECT mitra_id FROM venues WHERE id = $1 AND deleted_at IS NULL", venueID).Scan(&ownerID)
	if err != nil || ownerID != userID {
		writeJSON(w, http.StatusForbidden, model.APIResponse{Success: false, Error: "Akses ditolak"})
		return
	}

	var req struct {
		Name        string   `json:"name"`
		Address     string   `json:"address"`
		Latitude    float64  `json:"latitude"`
		Longitude   float64  `json:"longitude"`
		Description string   `json:"description"`
		Facilities  []string `json:"facilities"`
		ImageURLs   []string `json:"image_urls"`
		SportType   string   `json:"sport_type"`
		CourtCount  int      `json:"court_count"`
		Price       int64    `json:"price"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	slug := generateSlug(req.Name)
	uniqueSlug := slug
	for {
		var exists int
		h.db.QueryRow("SELECT COUNT(*) FROM venues WHERE slug = $1 AND id != $2", uniqueSlug, venueID).Scan(&exists)
		if exists == 0 {
			break
		}
		uniqueSlug = slug + "-" + randomSuffix()
	}

	var currentCourtCount int
	h.db.QueryRow("SELECT COUNT(*) FROM courts WHERE venue_id = $1", venueID).Scan(&currentCourtCount)

	tx, err := h.db.Begin()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		UPDATE venues SET name=$1, slug=$2, address=$3, latitude=$4, longitude=$5,
			description=$6, facilities=$7, image_urls=$8, sport_type=$9,
			updated_at=NOW()
		WHERE id=$10
	`, req.Name, uniqueSlug, req.Address, req.Latitude, req.Longitude,
		req.Description, pq.StringArray(req.Facilities), pq.StringArray(req.ImageURLs),
		req.SportType, venueID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengupdate venue"})
		return
	}

	if req.Price > 0 {
		_, err = tx.Exec("UPDATE courts SET price_per_hour=$1 WHERE venue_id=$2", req.Price, venueID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal update harga"})
			return
		}
	}

	if req.CourtCount > currentCourtCount {
		for i := currentCourtCount + 1; i <= req.CourtCount; i++ {
			courtName := fmt.Sprintf("Lapangan %d", i)
			tx.Exec(`INSERT INTO courts (venue_id, name, price_per_hour, created_at) VALUES ($1,$2,$3,NOW())`,
				venueID, courtName, req.Price)
		}
	} else if req.CourtCount < currentCourtCount && req.CourtCount > 0 {
		var courtIDs []string
		rows, err := tx.Query(`
			SELECT id FROM courts WHERE venue_id = $1 ORDER BY created_at DESC OFFSET $2
		`, venueID, req.CourtCount)
		if err == nil {
			for rows.Next() {
				var id string
				rows.Scan(&id)
				courtIDs = append(courtIDs, id)
			}
			rows.Close()
			for _, id := range courtIDs {
				var bookingCount int
				tx.QueryRow("SELECT COUNT(*) FROM bookings WHERE court_id=$1 AND slot_date >= CURRENT_DATE AND status NOT IN ('cancelled','completed')", id).Scan(&bookingCount)
				if bookingCount == 0 {
					tx.Exec("UPDATE courts SET status='closed' WHERE id=$1", id)
				}
			}
		}
	}

	tx.Commit()
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "Venue berhasil diupdate"})
}

func (h *MitraHandler) DeleteVenue(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	venueID := r.PathValue("id")

	var ownerID string
	h.db.QueryRow("SELECT mitra_id FROM venues WHERE id = $1 AND deleted_at IS NULL", venueID).Scan(&ownerID)
	if ownerID != userID {
		writeJSON(w, http.StatusForbidden, model.APIResponse{Success: false, Error: "Akses ditolak"})
		return
	}

	_, err := h.db.Exec("UPDATE venues SET deleted_at=NOW() WHERE id=$1", venueID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal menghapus venue"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "Venue berhasil dihapus"})
}

func (h *MitraHandler) RestoreVenue(w http.ResponseWriter, r *http.Request) {
	venueID := r.PathValue("id")
	_, err := h.db.Exec("UPDATE venues SET deleted_at=NULL WHERE id=$1", venueID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal restore venue"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "Venue berhasil direstore"})
}

func (h *MitraHandler) ListDeletedVenues(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, mitra_id, name, address, deleted_at
		FROM venues WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data"})
		return
	}
	defer rows.Close()

	type deletedVenue struct {
		ID        string     `json:"id"`
		MitraID   string     `json:"mitra_id"`
		Name      string     `json:"name"`
		Address   string     `json:"address"`
		DeletedAt *time.Time `json:"deleted_at"`
	}
	var venues []deletedVenue
	for rows.Next() {
		var v deletedVenue
		rows.Scan(&v.ID, &v.MitraID, &v.Name, &v.Address, &v.DeletedAt)
		venues = append(venues, v)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: venues})
}

func (h *MitraHandler) ListSlots(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	venueID := r.URL.Query().Get("venue_id")
	courtID := r.URL.Query().Get("court_id")
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	var query string
	var args []interface{}

	if courtID != "" {
		query = `SELECT s.id, s.court_id, s.date, s.start_time, s.end_time, s.status
			FROM slots s JOIN courts c ON c.id = s.court_id JOIN venues v ON v.id = c.venue_id
			WHERE s.court_id = $1 AND s.date = $2 AND v.mitra_id = $3`
		args = []interface{}{courtID, date, userID}
	} else if venueID != "" {
		query = `SELECT s.id, s.court_id, s.date, s.start_time, s.end_time, s.status
			FROM slots s JOIN courts c ON c.id = s.court_id JOIN venues v ON v.id = c.venue_id
			WHERE c.venue_id = $1 AND s.date = $2 AND v.mitra_id = $3`
		args = []interface{}{venueID, date, userID}
	} else {
		var firstCourtID string
		err := h.db.QueryRow(`
			SELECT c.id FROM courts c
			JOIN venues v ON v.id = c.venue_id
			WHERE v.mitra_id = $1 AND c.status = 'active'
			LIMIT 1
		`, userID).Scan(&firstCourtID)
		if err != nil {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Tidak ada court ditemukan"})
			return
		}
		query = `SELECT s.id, s.court_id, s.date, s.start_time, s.end_time, s.status
			FROM slots s WHERE s.court_id = $1 AND s.date = $2`
		args = []interface{}{firstCourtID, date}
	}

	rows, err := h.db.Query(query, args...)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil slot"})
		return
	}
	defer rows.Close()

	type slotItem struct {
		ID        string `json:"id"`
		CourtID   string `json:"court_id"`
		Date      string `json:"date"`
		StartTime string `json:"start_time"`
		EndTime   string `json:"end_time"`
		Status    string `json:"status"`
	}
	var slots []slotItem
	for rows.Next() {
		var s slotItem
		rows.Scan(&s.ID, &s.CourtID, &s.Date, &s.StartTime, &s.EndTime, &s.Status)
		slots = append(slots, s)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: slots})
}

func (h *MitraHandler) GenerateSlots(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID

	var req struct {
		VenueID      string `json:"venue_id"`
		CourtID      string `json:"court_id"`
		StartTime    string `json:"start_time"`
		EndTime      string `json:"end_time"`
		SlotDuration int64  `json:"slot_duration"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}
	if req.StartTime == "" {
		req.StartTime = "06:00"
	}
	if req.EndTime == "" {
		req.EndTime = "22:00"
	}
	if req.SlotDuration <= 0 {
		req.SlotDuration = 90
	}

	var courtIDs []string
	if req.CourtID != "" {
		courtIDs = append(courtIDs, req.CourtID)
	} else if req.VenueID != "" {
		rows, err := h.db.Query("SELECT id FROM courts WHERE venue_id=$1 AND deleted_at IS NULL", req.VenueID)
		if err == nil {
			for rows.Next() {
				var id string
				rows.Scan(&id)
				courtIDs = append(courtIDs, id)
			}
			rows.Close()
		}
	} else {
		rows, err := h.db.Query(`
			SELECT c.id FROM courts c JOIN venues v ON v.id = c.venue_id
			WHERE v.mitra_id=$1 AND c.deleted_at IS NULL
		`, userID)
		if err == nil {
			for rows.Next() {
				var id string
				rows.Scan(&id)
				courtIDs = append(courtIDs, id)
			}
			rows.Close()
		}
	}

	if len(courtIDs) == 0 {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Tidak ada court ditemukan"})
		return
	}

	startParts := strings.Split(req.StartTime, ":")
	endParts := strings.Split(req.EndTime, ":")
	startMin := parseInt(startParts[0], 0)*60 + parseInt(startParts[1], 0)
	endMin := parseInt(endParts[0], 0)*60 + parseInt(endParts[1], 0)

	today := time.Now()
	inserted := 0
	var valueStrings []string
	var valueArgs []interface{}
	argIdx := 1
	for _, cid := range courtIDs {
		for day := 0; day < 7; day++ {
			date := today.AddDate(0, 0, day).Format("2006-01-02")
			h.db.Exec("DELETE FROM slots WHERE court_id=$1 AND date=$2", cid, date)
			for t := startMin; t+req.SlotDuration <= endMin; t += req.SlotDuration {
				startH := t / 60
				startM := t % 60
				endT := t + req.SlotDuration
				endH := endT / 60
				endM := endT % 60
				startStr := fmt.Sprintf("%02d:%02d", startH, startM)
				endStr := fmt.Sprintf("%02d:%02d", endH, endM)
				valueStrings = append(valueStrings, fmt.Sprintf("($%d,$%d,$%d,$%d,'available',NOW())", argIdx, argIdx+1, argIdx+2, argIdx+3))
				valueArgs = append(valueArgs, cid, date, startStr, endStr)
				argIdx += 4
				inserted++
			}
		}
	}
	if len(valueStrings) > 0 {
		query := fmt.Sprintf(
			"INSERT INTO slots (court_id, date, start_time, end_time, status, created_at) VALUES %s ON CONFLICT (court_id, date, start_time) DO NOTHING",
			strings.Join(valueStrings, ","),
		)
		h.db.Exec(query, valueArgs...)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]int{"inserted": inserted}})
}

func (h *MitraHandler) ToggleSlot(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	slotID := r.PathValue("id")

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}
	if req.Status != "available" && req.Status != "blocked" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Status harus available atau blocked"})
		return
	}

	var ownerMatch int
	h.db.QueryRow(`
		SELECT COUNT(*) FROM slots s
		JOIN courts c ON c.id = s.court_id
		JOIN venues v ON v.id = c.venue_id
		WHERE s.id = $1 AND v.mitra_id = $2 AND s.status != 'booked'
	`, slotID, userID).Scan(&ownerMatch)

	if ownerMatch == 0 {
		writeJSON(w, http.StatusForbidden, model.APIResponse{Success: false, Error: "Slot tidak ditemukan atau sudah dibooking"})
		return
	}

	_, err := h.db.Exec("UPDATE slots SET status=$1 WHERE id=$2", req.Status, slotID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengubah status slot"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) DailyRevenue(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	rangeParam := r.URL.Query().Get("range")
	tz := r.URL.Query().Get("tz")
	if tz == "" {
		tz = "Asia/Jakarta"
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)

	var startDate time.Time
	if rangeParam == "last" {
		startDate = time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, loc)
	} else {
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	}

	rows, err := h.db.Query(`
		SELECT s.date, COALESCE(SUM(b.mitra_payout),0)
		FROM bookings b
		JOIN slots s ON s.id = b.slot_id
		JOIN venues v ON v.id = b.venue_id
		WHERE v.mitra_id = $1 AND b.status = 'completed'
		AND b.booked_at >= $2
		GROUP BY s.date ORDER BY s.date
	`, userID, startDate)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil revenue"})
		return
	}
	defer rows.Close()

	dayNames := map[string]string{
		"Monday": "Sen", "Tuesday": "Sel", "Wednesday": "Rab",
		"Thursday": "Kam", "Friday": "Jum", "Saturday": "Sab", "Sunday": "Min",
	}

	type dailyRev struct {
		Day   string `json:"day"`
		Value int64  `json:"value"`
	}
	var result []dailyRev
	for rows.Next() {
		var dateStr string
		var value int64
		rows.Scan(&dateStr, &value)
		parsed, err := time.Parse("2006-01-02", dateStr)
		day := dateStr
		if err == nil {
			day = dayNames[parsed.Weekday().String()]
		}
		result = append(result, dailyRev{Day: day, Value: value})
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: result})
}

func (h *MitraHandler) MitraTransactions(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	page := parseInt(r.URL.Query().Get("page"), 1)
	limit := parseInt(r.URL.Query().Get("limit"), 20)
	offset := (page - 1) * limit

	rows, err := h.db.Query(`
		SELECT b.id, s.date::text, s.start_time::text, b.gross_amount, b.admin_fee, b.mitra_payout,
			b.status, b.booked_at::text,
			v.name
		FROM bookings b
		JOIN slots s ON s.id = b.slot_id
		JOIN venues v ON v.id = b.venue_id
		WHERE v.mitra_id = $1
		ORDER BY b.booked_at DESC LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil transaksi"})
		return
	}
	defer rows.Close()

	var txns []map[string]interface{}
	for rows.Next() {
		var id, slotDate, slotTime, bookedAt, status, venueName string
		var grossAmount, adminFee, mitraPayout int64
		if err := rows.Scan(&id, &slotDate, &slotTime, &grossAmount, &adminFee, &mitraPayout,
			&status, &bookedAt, &venueName); err != nil {
			continue
		}
		txns = append(txns, map[string]interface{}{
			"id":           id,
			"date":         bookedAt,
			"slot_date":    slotDate,
			"slot_time":    slotTime,
			"gross_amount": grossAmount,
			"admin_fee":    adminFee,
			"mitra_payout": mitraPayout,
			"status":       status,
			"venue_name":   venueName,
		})
	}
	if txns == nil {
		txns = make([]map[string]interface{}, 0)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: txns})
}

func (h *MitraHandler) MitraWithdrawals(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	rows, err := h.db.Query(`
		SELECT id, amount, admin_fee, net_amount, status, created_at, processed_at,
			COALESCE(bank_name, ''), COALESCE(reject_reason, '')
		FROM withdrawals WHERE mitra_id = $1 ORDER BY created_at DESC
	`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil withdrawal"})
		return
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var id string
		var amount, adminFee, netAmount int64
		var status string
		var createdAt, processedAt *time.Time
		var bankName, rejectReason string
		if err := rows.Scan(&id, &amount, &adminFee, &netAmount, &status,
			&createdAt, &processedAt, &bankName, &rejectReason); err != nil {
			continue
		}
		dateStr := ""
		if createdAt != nil {
			dateStr = createdAt.Format("2006-01-02")
		}
		result = append(result, map[string]interface{}{
			"id":           id,
			"amount":       amount,
			"admin_fee":    adminFee,
			"net_amount":   netAmount,
			"bank":         bankName,
			"date":         dateStr,
			"status":       status,
			"reject_reason": rejectReason,
		})
	}
	if result == nil {
		result = make([]map[string]interface{}, 0)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: result})
}

func (h *MitraHandler) CreateWithdrawal(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims := ctx.Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID

	var req struct {
		Amount int64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	if req.Amount < 50000 {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Minimal penarikan Rp50.000"})
		return
	}

	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	var availableBalance int64
	tx.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(b.mitra_payout),0) FROM bookings b
		JOIN venues v ON v.id = b.venue_id
		WHERE v.mitra_id = $1 AND b.status = 'completed'
		AND b.withdrawal_status IS DISTINCT FROM 'withdrawn'
		FOR UPDATE
	`, userID).Scan(&availableBalance)

	if req.Amount > availableBalance {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Saldo tidak mencukupi"})
		return
	}

	adminFee := int64(math.Round(float64(req.Amount) * 0.02))
	netAmount := req.Amount - adminFee
	if netAmount < 0 {
		netAmount = 0
	}

	var withdrawalID string
	err = tx.QueryRowContext(ctx, `
		INSERT INTO withdrawals (mitra_id, amount, admin_fee, net_amount, status, created_at)
		VALUES ($1,$2,$3,$4,'pending',NOW()) RETURNING id
	`, userID, req.Amount, adminFee, netAmount).Scan(&withdrawalID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal membuat withdrawal"})
		return
	}

	tx.ExecContext(ctx, `
		UPDATE bookings SET withdrawal_status='withdrawn'
		WHERE venue_id IN (SELECT id FROM venues WHERE mitra_id = $1)
		AND status = 'completed' AND withdrawal_status IS DISTINCT FROM 'withdrawn'
	`, userID)

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal menyimpan withdrawal"})
		return
	}

	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: map[string]string{"id": withdrawalID}})
}

func (h *MitraHandler) MitraReviews(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	rows, err := h.db.Query(`
		SELECT r.id, r.venue_id, r.user_id, r.rating, r.comment, r.reply_text, r.created_at,
			v.name as venue_name, u.full_name
		FROM reviews r
		JOIN venues v ON v.id = r.venue_id
		JOIN users u ON u.id = r.user_id
		WHERE v.mitra_id = $1 ORDER BY r.created_at DESC
	`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil review"})
		return
	}
	defer rows.Close()

	type reviewItem struct {
		ID           string    `json:"id"`
		VenueID      string    `json:"venue_id"`
		UserID       string    `json:"user_id"`
		Rating       float64   `json:"rating"`
		Comment      string    `json:"comment"`
		ReplyText    *string   `json:"reply_text"`
		CreatedAt    time.Time `json:"created_at"`
		VenueName    string    `json:"venue_name"`
		UserName     string    `json:"user_name"`
		UserInitials string    `json:"user_initials"`
	}
	var reviews []reviewItem
	for rows.Next() {
		var ri reviewItem
		rows.Scan(&ri.ID, &ri.VenueID, &ri.UserID, &ri.Rating, &ri.Comment, &ri.ReplyText, &ri.CreatedAt, &ri.VenueName, &ri.UserName)
		parts := strings.Fields(ri.UserName)
		if len(parts) > 0 {
			ri.UserInitials = strings.ToUpper(string(parts[0][0]))
			if len(parts) > 1 {
				ri.UserInitials += strings.ToUpper(string(parts[len(parts)-1][0]))
			}
		}
		reviews = append(reviews, ri)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: reviews})
}

func (h *MitraHandler) ReplyReview(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	reviewID := r.PathValue("id")

	var req struct {
		ReplyText string `json:"reply_text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	var ownerMatch int
	h.db.QueryRow(`
		SELECT COUNT(*) FROM reviews r
		JOIN venues v ON v.id = r.venue_id
		WHERE r.id = $1 AND v.mitra_id = $2
	`, reviewID, userID).Scan(&ownerMatch)

	if ownerMatch == 0 {
		writeJSON(w, http.StatusForbidden, model.APIResponse{Success: false, Error: "Review tidak ditemukan"})
		return
	}

	_, err := h.db.Exec("UPDATE reviews SET reply_text=$1, replied_at=NOW() WHERE id=$2", req.ReplyText, reviewID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal membalas review"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) ProfileSettings(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID

	type settingsData struct {
		ID             string     `json:"id"`
		FullName       string     `json:"full_name"`
		Email          string     `json:"email"`
		Phone          string     `json:"phone"`
		Address        string     `json:"address"`
		AvatarURL      *string    `json:"avatar_url"`
		WaNumber       string     `json:"wa_number"`
		CreatedAt      time.Time  `json:"created_at"`
		BankName       string     `json:"bank_name"`
		AccountNumber  string     `json:"account_number"`
		AccountHolder  string     `json:"account_holder"`
		IsVerified     bool       `json:"is_verified"`
		VerifiedAt     *time.Time `json:"verified_at"`
		NotifyBooking  bool       `json:"notify_booking"`
		NotifyPayment  bool       `json:"notify_payment"`
		NotifyReview   bool       `json:"notify_review"`
		NotifyDaily    bool       `json:"notify_daily"`
		DailyReportTime string   `json:"daily_report_time"`
	}

	var data settingsData
	err := h.db.QueryRow(`
		SELECT
			u.id, u.full_name, u.email, u.phone,
			COALESCE(u.address, ''),
			u.avatar_url,
			COALESCE(ms.wa_number, ''),
			u.created_at,
			COALESCE(ms.bank_name, ''), COALESCE(ms.account_number, ''), COALESCE(ms.account_holder, ''),
			COALESCE(ms.is_verified, false),
			ms.verified_at,
			COALESCE(ms.notify_booking, true), COALESCE(ms.notify_payment, true),
			COALESCE(ms.notify_review, false), COALESCE(ms.notify_daily, true),
			COALESCE(ms.daily_report_time, '21:00')
		FROM users u
		LEFT JOIN mitra_settings ms ON ms.user_id = u.id
		WHERE u.id = $1
	`, userID).Scan(
		&data.ID, &data.FullName, &data.Email, &data.Phone,
		&data.Address,
		&data.AvatarURL,
		&data.WaNumber,
		&data.CreatedAt,
		&data.BankName, &data.AccountNumber, &data.AccountHolder,
		&data.IsVerified,
		&data.VerifiedAt,
		&data.NotifyBooking, &data.NotifyPayment,
		&data.NotifyReview, &data.NotifyDaily,
		&data.DailyReportTime,
	)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "User tidak ditemukan"})
		return
	}

	if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodPatch {
		var req struct {
			FullName        string `json:"full_name"`
			Phone           string `json:"phone"`
			Address         string `json:"address"`
			WaNumber        string `json:"wa_number"`
			BankName        string `json:"bank_name"`
			AccountNumber   string `json:"account_number"`
			AccountHolder   string `json:"account_holder"`
			NotifyBooking   *bool  `json:"notify_booking"`
			NotifyPayment   *bool  `json:"notify_payment"`
			NotifyReview    *bool  `json:"notify_review"`
			NotifyDaily     *bool  `json:"notify_daily"`
			DailyReportTime string `json:"daily_report_time"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
			return
		}

		h.db.Exec(`
			UPDATE users SET
				full_name = COALESCE(NULLIF($1, ''), full_name),
				phone = COALESCE(NULLIF($2, ''), phone),
				address = COALESCE(NULLIF($3, ''), address),
				updated_at = NOW()
			WHERE id = $4
		`, req.FullName, req.Phone, req.Address, userID)

		h.db.Exec(`
			INSERT INTO mitra_settings (user_id, wa_number, bank_name, account_number, account_holder,
				notify_booking, notify_payment, notify_review, notify_daily, daily_report_time)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (user_id) DO UPDATE SET
				wa_number = COALESCE(NULLIF($2, ''), mitra_settings.wa_number),
				bank_name = COALESCE(NULLIF($3, ''), mitra_settings.bank_name),
				account_number = COALESCE(NULLIF($4, ''), mitra_settings.account_number),
				account_holder = COALESCE(NULLIF($5, ''), mitra_settings.account_holder),
				notify_booking = COALESCE($6, mitra_settings.notify_booking),
				notify_payment = COALESCE($7, mitra_settings.notify_payment),
				notify_review = COALESCE($8, mitra_settings.notify_review),
				notify_daily = COALESCE($9, mitra_settings.notify_daily),
				daily_report_time = COALESCE(NULLIF($10, ''), mitra_settings.daily_report_time),
				updated_at = NOW()
		`, userID,
			nullString(req.WaNumber), nullString(req.BankName), nullString(req.AccountNumber), nullString(req.AccountHolder),
			req.NotifyBooking, req.NotifyPayment, req.NotifyReview, req.NotifyDaily,
			nullString(req.DailyReportTime))
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: data})
}

func (h *MitraHandler) MitraNotifications(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	rows, err := h.db.Query(`
		SELECT id, user_id, title, message, is_read, created_at
		FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50
	`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil notifikasi"})
		return
	}
	defer rows.Close()

	type notif struct {
		ID        string    `json:"id"`
		UserID    string    `json:"user_id"`
		Title     string    `json:"title"`
		Message   string    `json:"message"`
		IsRead    bool      `json:"is_read"`
		CreatedAt time.Time `json:"created_at"`
	}
	var notifications []notif
	for rows.Next() {
		var n notif
		rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.IsRead, &n.CreatedAt)
		notifications = append(notifications, n)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: notifications})
}

func (h *MitraHandler) AdminMitras(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, full_name, email, phone,
			CASE WHEN is_suspended THEN 'suspended' ELSE 'active' END as status,
			created_at
		FROM users WHERE role = 'mitra' ORDER BY created_at DESC
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data mitra"})
		return
	}
	defer rows.Close()

	type adminMitra struct {
		ID        string    `json:"id"`
		FullName  string    `json:"full_name"`
		Email     string    `json:"email"`
		Phone     string    `json:"phone"`
		Status    string    `json:"status"`
		CreatedAt time.Time `json:"created_at"`
	}
	var mitras []adminMitra
	for rows.Next() {
		var m adminMitra
		rows.Scan(&m.ID, &m.FullName, &m.Email, &m.Phone, &m.Status, &m.CreatedAt)
		mitras = append(mitras, m)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: mitras})
}

func (h *MitraHandler) UpdateMitraStatus(w http.ResponseWriter, r *http.Request) {
	mitraID := r.PathValue("id")
	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}
	_, err := h.db.Exec("UPDATE users SET is_suspended = ($1 = 'suspended') WHERE id=$2 AND role='mitra'", req.Status, mitraID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengubah status"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) AdminReviews(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT r.id, r.venue_id, r.user_id, r.rating, r.comment, r.reply_text, r.created_at,
			v.name, u.full_name, r.is_visible, r.is_flagged, COALESCE(r.flag_reason, '')
		FROM reviews r
		JOIN venues v ON v.id = r.venue_id
		JOIN users u ON u.id = r.user_id
		ORDER BY r.created_at DESC LIMIT 100
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil review"})
		return
	}
	defer rows.Close()

	var totalReviews int
	var avgRating float64
	var flaggedCount int
	h.db.QueryRow(`SELECT COUNT(*), COALESCE(AVG(rating), 0), SUM(CASE WHEN is_flagged THEN 1 ELSE 0 END) FROM reviews`).Scan(&totalReviews, &avgRating, &flaggedCount)

	type adminReviewItem struct {
		ID         string    `json:"id"`
		VenueID    string    `json:"venue_id"`
		UserID     string    `json:"user_id"`
		Rating     float64   `json:"rating"`
		Comment    string    `json:"text"`
		ReplyText  string    `json:"reply_text"`
		CreatedAt  time.Time `json:"date"`
		VenueName  string    `json:"venue"`
		User       string    `json:"user"`
		Initials   string    `json:"initials"`
		Visible    bool      `json:"visible"`
		Flagged    bool      `json:"flagged"`
		FlagReason string    `json:"flag_reason"`
	}
	var reviews []adminReviewItem
	for rows.Next() {
		var ri adminReviewItem
		var replyText sql.NullString
		var flagReason sql.NullString
		var venueName sql.NullString
		var userName sql.NullString
		var visible, flagged bool
		err := rows.Scan(&ri.ID, &ri.VenueID, &ri.UserID, &ri.Rating, &ri.Comment, &replyText, &ri.CreatedAt, &venueName, &userName, &visible, &flagged, &flagReason)
		if err != nil {
			continue
		}
		ri.ReplyText = replyText.String
		ri.FlagReason = flagReason.String
		ri.VenueName = venueName.String
		ri.User = userName.String
		ri.Visible = visible
		ri.Flagged = flagged
		parts := strings.Fields(ri.User)
		if len(parts) > 0 {
			ri.Initials = strings.ToUpper(string(parts[0][0]))
			if len(parts) > 1 {
				ri.Initials += strings.ToUpper(string(parts[len(parts)-1][0]))
			}
		}
		reviews = append(reviews, ri)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: map[string]any{
			"reviews":       reviews,
			"total_reviews": totalReviews,
			"avg_rating":    avgRating,
			"flagged_count": flaggedCount,
		},
	})
}

func (h *MitraHandler) AdminReviewPatch(w http.ResponseWriter, r *http.Request) {
	reviewID := r.PathValue("id")
	var req struct {
		Action    string `json:"action"`
		Reply     string `json:"reply"`
		FlagReason string `json:"flag_reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	switch req.Action {
	case "approve":
		_, err := h.db.Exec("UPDATE reviews SET is_visible=true, is_flagged=false, flag_reason=NULL WHERE id=$1", reviewID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal approve review"})
			return
		}
		writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "Ulasan berhasil disetujui"})
	case "flag":
		reason := req.FlagReason
		if reason == "" {
			reason = "Ditandai oleh admin"
		}
		_, err := h.db.Exec("UPDATE reviews SET is_flagged=true, flag_reason=$1 WHERE id=$2", reason, reviewID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal menandai review"})
			return
		}
		writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "Ulasan berhasil ditandai"})
	case "delete":
		_, err := h.db.Exec("DELETE FROM reviews WHERE id=$1", reviewID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal menghapus review"})
			return
		}
		writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "Ulasan berhasil dihapus"})
	default:
		if req.Reply != "" {
			_, err := h.db.Exec("UPDATE reviews SET reply_text=$1, replied_at=NOW() WHERE id=$2", req.Reply, reviewID)
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal update review"})
				return
			}
			writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
		} else {
			writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Aksi tidak dikenal"})
		}
	}
}

func (h *MitraHandler) AdminAuditLogs(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT al.id, al.user_id, al.action, al.entity, COALESCE(al.entity_id, ''), COALESCE(al.ip_address::text, ''), COALESCE(al.user_agent, ''), al.created_at
		FROM audit_logs al ORDER BY al.created_at DESC LIMIT 1000
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil log"})
		return
	}
	defer rows.Close()

	var buf bytes.Buffer
	buf.WriteString("ID,User ID,Action,Entity,Entity ID,IP Address,User Agent,Created At\n")
	for rows.Next() {
		var id int64
		var userID, action, entity, entityID, ipAddress, userAgent string
		var createdAt time.Time
		rows.Scan(&id, &userID, &action, &entity, &entityID, &ipAddress, &userAgent, &createdAt)
		buf.WriteString(fmt.Sprintf("%d,%s,%s,%s,%s,%s,%s,%s\n", id, userID, action, entity, entityID, ipAddress, userAgent, createdAt.Format(time.RFC3339)))
	}
	if buf.Len() == 0 {
		buf.WriteString("No audit logs found\n")
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=audit_logs.csv")
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}

func (h *MitraHandler) AdminWithdrawals(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT w.id, w.mitra_id, w.amount, w.admin_fee, w.net_amount, w.status, w.created_at, w.processed_at
		FROM withdrawals w ORDER BY w.created_at DESC LIMIT 100
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil withdrawal"})
		return
	}
	defer rows.Close()

	type adminWithdrawal struct {
		ID          string     `json:"id"`
		MitraID     string     `json:"mitra_id"`
		Amount      int64      `json:"amount"`
		AdminFee    int64      `json:"admin_fee"`
		NetAmount   int64      `json:"net_amount"`
		Status      string     `json:"status"`
		CreatedAt   time.Time  `json:"created_at"`
		ProcessedAt *time.Time `json:"processed_at"`
	}
	var withdrawals []adminWithdrawal
	for rows.Next() {
		var w adminWithdrawal
		rows.Scan(&w.ID, &w.MitraID, &w.Amount, &w.AdminFee, &w.NetAmount, &w.Status, &w.CreatedAt, &w.ProcessedAt)
		withdrawals = append(withdrawals, w)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: withdrawals})
}

func (h *MitraHandler) ApproveWithdrawal(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	withdrawalID := r.PathValue("id")

	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	var mitraID string
	tx.QueryRowContext(ctx, "SELECT mitra_id FROM withdrawals WHERE id=$1 AND status='pending' FOR UPDATE", withdrawalID).Scan(&mitraID)
	if mitraID == "" {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Withdrawal tidak ditemukan"})
		return
	}

	_, err = tx.ExecContext(ctx, "UPDATE withdrawals SET status='processing', processed_at=NOW() WHERE id=$1", withdrawalID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal approve"})
		return
	}

	tx.Commit()
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) RejectWithdrawal(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	withdrawalID := r.PathValue("id")

	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	var mitraID string
	tx.QueryRowContext(ctx, "SELECT mitra_id FROM withdrawals WHERE id=$1 AND status='pending' FOR UPDATE", withdrawalID).Scan(&mitraID)
	if mitraID == "" {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Withdrawal tidak ditemukan"})
		return
	}

	_, err = tx.ExecContext(ctx, "UPDATE withdrawals SET status='rejected' WHERE id=$1", withdrawalID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal reject"})
		return
	}

	tx.ExecContext(ctx, `
		UPDATE bookings SET withdrawal_status=NULL
		WHERE venue_id IN (SELECT id FROM venues WHERE mitra_id = $1)
		AND withdrawal_status = 'withdrawn'
	`, mitraID)

	tx.Commit()
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, full_name, email, phone, role, is_verified, is_suspended, created_at
		FROM users ORDER BY created_at DESC LIMIT 100
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data user"})
		return
	}
	defer rows.Close()

	type userItem struct {
		ID          string    `json:"id"`
		FullName    string    `json:"full_name"`
		Email       string    `json:"email"`
		Phone       string    `json:"phone"`
		Role        string    `json:"role"`
		IsVerified  bool      `json:"is_verified"`
		IsSuspended bool      `json:"is_suspended"`
		CreatedAt   time.Time `json:"created_at"`
	}
	var users []userItem
	for rows.Next() {
		var u userItem
		rows.Scan(&u.ID, &u.FullName, &u.Email, &u.Phone, &u.Role, &u.IsVerified, &u.IsSuspended, &u.CreatedAt)
		users = append(users, u)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: users})
}

func (h *MitraHandler) ToggleUserSuspend(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	var req struct {
		Suspended bool `json:"suspended"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}
	_, err := h.db.Exec("UPDATE users SET is_suspended = $1 WHERE id = $2", req.Suspended, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal update user"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) AdminCancelBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := r.PathValue("id")

	tx, err := h.db.Begin()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	var currentStatus string
	err = tx.QueryRow(`SELECT status FROM bookings WHERE id = $1 FOR UPDATE`, bookingID).Scan(&currentStatus)
	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Booking tidak ditemukan"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data booking"})
		return
	}

	if currentStatus == "cancelled" || currentStatus == "completed" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Booking tidak dapat dibatalkan"})
		return
	}

	_, err = tx.Exec(`UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1`, bookingID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal membatalkan booking"})
		return
	}

	_, err = tx.Exec(`UPDATE slots SET status = 'available' WHERE id = (SELECT slot_id FROM bookings WHERE id = $1)`, bookingID)
	if err != nil {
		fmt.Printf("[AdminCancelBooking] Failed to release slot: %v\n", err)
	}

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal commit"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) AdminUpdateVenueStatus(w http.ResponseWriter, r *http.Request) {
	venueID := r.PathValue("id")
	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}
	if req.Status != "active" && req.Status != "suspended" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Status harus active atau suspended"})
		return
	}
	_, err := h.db.Exec("UPDATE venues SET status = $1 WHERE id = $2", req.Status, venueID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal update venue"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) AdminListPromoCodes(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, code, discount_percent, COALESCE(max_discount,0), COALESCE(min_amount,0),
			COALESCE(max_uses,0), valid_until, is_active, created_at
		FROM promo_codes ORDER BY created_at DESC
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data promo"})
		return
	}
	defer rows.Close()

	type promoItem struct {
		ID              string     `json:"id"`
		Code            string     `json:"code"`
		DiscountPercent int        `json:"discount_percent"`
		MaxDiscount     int64      `json:"max_discount"`
		MinAmount       int64      `json:"min_amount"`
		MaxUses         int        `json:"max_uses"`
		ValidUntil      *time.Time `json:"valid_until,omitempty"`
		IsActive        bool       `json:"is_active"`
		CreatedAt       time.Time  `json:"created_at"`
	}
	var promos []promoItem
	for rows.Next() {
		var p promoItem
		rows.Scan(&p.ID, &p.Code, &p.DiscountPercent, &p.MaxDiscount, &p.MinAmount,
			&p.MaxUses, &p.ValidUntil, &p.IsActive, &p.CreatedAt)
		promos = append(promos, p)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: promos})
}

func (h *MitraHandler) AdminCreatePromoCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code            string `json:"code"`
		DiscountPercent int    `json:"discount_percent"`
		MaxDiscount     int64  `json:"max_discount"`
		MinAmount       int64  `json:"min_amount"`
		MaxUses         int    `json:"max_uses"`
		ValidUntil      string `json:"valid_until"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}
	if req.Code == "" || req.DiscountPercent <= 0 {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Kode dan diskon wajib diisi"})
		return
	}

	var validUntil *time.Time
	if req.ValidUntil != "" {
		t, err := time.Parse(time.RFC3339, req.ValidUntil)
		if err == nil {
			validUntil = &t
		}
	}

	_, err := h.db.Exec(`
		INSERT INTO promo_codes (code, discount_percent, max_discount, min_amount, max_uses, valid_until)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, req.Code, req.DiscountPercent, req.MaxDiscount, req.MinAmount, req.MaxUses, validUntil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal membuat promo"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) AdminUpdatePromoCode(w http.ResponseWriter, r *http.Request) {
	promoID := r.PathValue("id")
	var req struct {
		Code            string `json:"code"`
		DiscountPercent int    `json:"discount_percent"`
		MaxDiscount     int64  `json:"max_discount"`
		MinAmount       int64  `json:"min_amount"`
		MaxUses         int    `json:"max_uses"`
		IsActive        *bool  `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	_, err := h.db.Exec(`
		UPDATE promo_codes SET
			code = COALESCE(NULLIF($1, ''), code),
			discount_percent = CASE WHEN $2 > 0 THEN $2 ELSE discount_percent END,
			max_discount = CASE WHEN $3 > 0 THEN $3 ELSE max_discount END,
			min_amount = CASE WHEN $4 > 0 THEN $4 ELSE min_amount END,
			max_uses = CASE WHEN $5 > 0 THEN $5 ELSE max_uses END,
			is_active = COALESCE($6, is_active)
		WHERE id = $7
	`, req.Code, req.DiscountPercent, req.MaxDiscount, req.MinAmount, req.MaxUses, req.IsActive, promoID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal update promo"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func (h *MitraHandler) AdminDeletePromoCode(w http.ResponseWriter, r *http.Request) {
	promoID := r.PathValue("id")
	_, err := h.db.Exec("DELETE FROM promo_codes WHERE id = $1", promoID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal hapus promo"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}

func parseInt(s string, defaultVal int64) int64 {
	if s == "" {
		return defaultVal
	}
	var v int64
	for _, c := range s {
		if c < '0' || c > '9' {
			return defaultVal
		}
		v = v*10 + int64(c-'0')
	}
	if v == 0 {
		return defaultVal
	}
	return v
}
