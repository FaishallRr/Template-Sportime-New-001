package handler

import (
	"database/sql"
	"net/http"

	"github.com/lib/pq"
	"github.com/sportime/api/internal/config"
	"github.com/sportime/api/internal/middleware"
	"github.com/sportime/api/internal/model"
)

type DashboardHandler struct {
	db  *sql.DB
	cfg *config.Config
}

func NewDashboardHandler(db *sql.DB, cfg *config.Config) *DashboardHandler {
	return &DashboardHandler{db: db, cfg: cfg}
}

func (h *DashboardHandler) AdminStats(w http.ResponseWriter, r *http.Request) {
	var totalUsers, totalVenues, totalBookings, totalRevenue int64
	h.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
	h.db.QueryRow("SELECT COUNT(*) FROM venues").Scan(&totalVenues)
	h.db.QueryRow("SELECT COUNT(*) FROM bookings").Scan(&totalBookings)
	h.db.QueryRow("SELECT COALESCE(SUM(gross_amount),0) FROM bookings WHERE status = 'completed'").Scan(&totalRevenue)

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]interface{}{
		"total_users":    totalUsers,
		"total_venues":   totalVenues,
		"total_bookings": totalBookings,
		"total_revenue":  totalRevenue,
	}})
}

func (h *DashboardHandler) RevenueChart(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT TO_CHAR(booked_at, 'YYYY-MM'), COALESCE(SUM(gross_amount),0)
		FROM bookings
		WHERE status = 'completed' AND booked_at > NOW() - INTERVAL '12 months'
		GROUP BY 1 ORDER BY 1
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data"})
		return
	}
	defer rows.Close()

	type monthlyRevenue struct {
		Month   string `json:"month"`
		Revenue int64  `json:"revenue"`
	}
	var result []monthlyRevenue
	for rows.Next() {
		var m monthlyRevenue
		rows.Scan(&m.Month, &m.Revenue)
		result = append(result, m)
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: result})
}

func (h *DashboardHandler) RecentBookings(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT b.id, b.gross_amount, b.admin_fee, b.mitra_payout, b.status, COALESCE(b.payment_method, ''),
			sl.date::text, sl.start_time::text, sl.end_time::text,
			v.image_urls, v.name,
			COALESCE(c.name, ''),
			COALESCE(u.full_name, u.email, '')
		FROM bookings b
		JOIN slots sl ON sl.id = b.slot_id
		JOIN venues v ON v.id = b.venue_id
		LEFT JOIN courts c ON c.id = b.court_id
		LEFT JOIN users u ON u.id = b.user_id
		ORDER BY b.booked_at DESC LIMIT 5
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data"})
		return
	}
	defer rows.Close()

	var bookings = make([]map[string]interface{}, 0)
	for rows.Next() {
		var id string
		var grossAmount, adminFee, mitraPayout int64
		var status, paymentMethod, slotDate, slotTime, slotEnd string
		var imageURLsRaw pq.StringArray
		var venueName, courtName, userName string
		if err := rows.Scan(&id, &grossAmount, &adminFee, &mitraPayout, &status,
			&paymentMethod, &slotDate, &slotTime, &slotEnd,
			&imageURLsRaw, &venueName, &courtName, &userName); err != nil {
			continue
		}
		var venueImage string
		if len(imageURLsRaw) > 0 {
			venueImage = imageURLsRaw[0]
		}
		bookings = append(bookings, map[string]interface{}{
			"id":            id,
			"gross_amount":  grossAmount,
			"admin_fee":     adminFee,
			"mitra_payout":  mitraPayout,
			"status":        status,
			"payment_method": paymentMethod,
			"slot_date":     slotDate,
			"slot_time":     slotTime,
			"slot_time_end": slotEnd,
			"venue_image":   venueImage,
			"venue_name":    venueName,
			"court_name":    courtName,
			"user_name":     userName,
		})
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: bookings})
}

func (h *DashboardHandler) MitraStats(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	var totalVenues, totalBookings, totalRevenue, todayBookings int64
	h.db.QueryRow("SELECT COUNT(*) FROM venues WHERE mitra_id = $1", userID).Scan(&totalVenues)
	h.db.QueryRow("SELECT COUNT(*) FROM bookings b JOIN venues v ON v.id = b.venue_id WHERE v.mitra_id = $1", userID).Scan(&totalBookings)
	h.db.QueryRow("SELECT COALESCE(SUM(b.gross_amount),0) FROM bookings b JOIN venues v ON v.id = b.venue_id WHERE v.mitra_id = $1 AND b.status = 'completed'", userID).Scan(&totalRevenue)
	h.db.QueryRow("SELECT COUNT(*) FROM bookings b JOIN slots sl ON sl.id = b.slot_id JOIN venues v ON v.id = b.venue_id WHERE v.mitra_id = $1 AND sl.date = CURRENT_DATE", userID).Scan(&todayBookings)

	recentRows, err := h.db.Query(`
		SELECT sl.start_time::text, COALESCE(c.name, ''), COALESCE(u.full_name, u.email, ''), b.status
		FROM bookings b
		JOIN slots sl ON sl.id = b.slot_id
		JOIN venues v ON v.id = b.venue_id
		LEFT JOIN courts c ON c.id = b.court_id
		LEFT JOIN users u ON u.id = b.user_id
		WHERE v.mitra_id = $1
		ORDER BY b.booked_at DESC LIMIT 5
	`, userID)
	var recentBookings []map[string]interface{}
	if err == nil {
		defer recentRows.Close()
		for recentRows.Next() {
			var time, court, user, status string
			if err := recentRows.Scan(&time, &court, &user, &status); err != nil {
				continue
			}
			recentBookings = append(recentBookings, map[string]interface{}{
				"time":   time,
				"court":  court,
				"user":   user,
				"status": status,
			})
		}
	}
	if recentBookings == nil {
		recentBookings = make([]map[string]interface{}, 0)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]interface{}{
		"total_venues":    totalVenues,
		"total_bookings":  totalBookings,
		"total_revenue":   totalRevenue,
		"today_bookings":  todayBookings,
		"recent_bookings": recentBookings,
	}})
}

func (h *DashboardHandler) MitraBookings(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID
	rows, err := h.db.Query(`
		SELECT b.id, b.gross_amount, b.mitra_payout, b.status,
			sl.date::text, sl.start_time::text, sl.end_time::text,
			v.image_urls,
			COALESCE(c.name, ''),
			COALESCE(u.full_name, u.email, '')
		FROM bookings b
		JOIN slots sl ON sl.id = b.slot_id
		JOIN venues v ON v.id = b.venue_id
		LEFT JOIN courts c ON c.id = b.court_id
		LEFT JOIN users u ON u.id = b.user_id
		WHERE v.mitra_id = $1
		ORDER BY b.booked_at DESC
	`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data"})
		return
	}
	defer rows.Close()

	var bookings = make([]map[string]interface{}, 0)
	for rows.Next() {
		var id string
		var grossAmount, mitraPayout int64
		var status, slotDate, slotTime, slotEnd string
		var imageURLsRaw pq.StringArray
		var courtName, userName string
		if err := rows.Scan(&id, &grossAmount, &mitraPayout, &status,
			&slotDate, &slotTime, &slotEnd,
			&imageURLsRaw, &courtName, &userName); err != nil {
			continue
		}
		var venueImage string
		if len(imageURLsRaw) > 0 {
			venueImage = imageURLsRaw[0]
		}
		bookings = append(bookings, map[string]interface{}{
			"id":           id,
			"gross_amount": grossAmount,
			"mitra_payout": mitraPayout,
			"status":       status,
			"slot_date":    slotDate,
			"slot_time":    slotTime,
			"slot_time_end": slotEnd,
			"venue_image":  venueImage,
			"court_name":   courtName,
			"user_name":    userName,
		})
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: bookings})
}

func (h *DashboardHandler) MitraRevenue(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	userID := claims.UserID

	var monthRevenue, lastMonthRevenue, totalRevenue, availableBalance int64

	h.db.QueryRow(`
		SELECT COALESCE(SUM(b.gross_amount),0) FROM bookings b
		JOIN venues v ON v.id = b.venue_id
		WHERE v.mitra_id = $1 AND b.status = 'completed'
		AND DATE_TRUNC('month', b.booked_at) = DATE_TRUNC('month', CURRENT_DATE)
	`, userID).Scan(&monthRevenue)

	h.db.QueryRow(`
		SELECT COALESCE(SUM(b.gross_amount),0) FROM bookings b
		JOIN venues v ON v.id = b.venue_id
		WHERE v.mitra_id = $1 AND b.status = 'completed'
		AND DATE_TRUNC('month', b.booked_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
	`, userID).Scan(&lastMonthRevenue)

	h.db.QueryRow(`
		SELECT COALESCE(SUM(b.gross_amount),0) FROM bookings b
		JOIN venues v ON v.id = b.venue_id
		WHERE v.mitra_id = $1 AND b.status = 'completed'
	`, userID).Scan(&totalRevenue)

	h.db.QueryRow(`
		SELECT COALESCE(SUM(b.mitra_payout),0) FROM bookings b
		JOIN venues v ON v.id = b.venue_id
		WHERE v.mitra_id = $1 AND b.status IN ('confirmed', 'completed')
		AND b.id NOT IN (SELECT booking_id FROM withdrawals WHERE booking_id IS NOT NULL)
	`, userID).Scan(&availableBalance)

	var feePercent int64 = 2
	withdrawalFee := availableBalance * feePercent / 100

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]interface{}{
		"month_revenue":     monthRevenue,
		"last_month_revenue": lastMonthRevenue,
		"total_revenue":     totalRevenue,
		"available_balance": availableBalance,
		"withdrawal_fee":    withdrawalFee,
	}})
}

func (h *DashboardHandler) AdminTransactions(w http.ResponseWriter, r *http.Request) {
	page := parseInt(r.URL.Query().Get("page"), 1)
	limit := parseInt(r.URL.Query().Get("limit"), 20)
	offset := (page - 1) * limit

	rows, err := h.db.Query(`
		SELECT b.id, b.gross_amount, b.admin_fee, b.mitra_payout, b.status, COALESCE(b.payment_method, ''),
			b.booked_at::text,
			sl.date::text, sl.start_time::text,
			v.image_urls, v.name,
			COALESCE(c.name, ''),
			COALESCE(u.full_name, u.email, '')
		FROM bookings b
		JOIN slots sl ON sl.id = b.slot_id
		JOIN venues v ON v.id = b.venue_id
		LEFT JOIN courts c ON c.id = b.court_id
		LEFT JOIN users u ON u.id = b.user_id
		ORDER BY b.booked_at DESC LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data"})
		return
	}
	defer rows.Close()

	var txns = make([]map[string]interface{}, 0)
	for rows.Next() {
		var id string
		var grossAmount, adminFee, mitraPayout int64
		var status, paymentMethod, bookedAt, slotDate, slotTime string
		var imageURLsRaw pq.StringArray
		var venueName, courtName, userName string
		if err := rows.Scan(&id, &grossAmount, &adminFee, &mitraPayout, &status,
			&paymentMethod, &bookedAt, &slotDate, &slotTime,
			&imageURLsRaw, &venueName, &courtName, &userName); err != nil {
			continue
		}
		var venueImage string
		if len(imageURLsRaw) > 0 {
			venueImage = imageURLsRaw[0]
		}
		txns = append(txns, map[string]interface{}{
			"id":             id,
			"gross_amount":   grossAmount,
			"admin_fee":      adminFee,
			"mitra_payout":   mitraPayout,
			"booking_price":  grossAmount,
			"platform_fee":   adminFee,
			"status":         status,
			"payment_method": paymentMethod,
			"booked_at":      bookedAt,
			"slot_date":      slotDate,
			"slot_time":      slotTime,
			"venue_image":    venueImage,
			"venue_name":     venueName,
			"court_name":     courtName,
			"user_name":      userName,
		})
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: txns})
}
