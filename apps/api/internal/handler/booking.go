package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/lib/pq"
	"github.com/sportime/api/internal/middleware"
	"github.com/sportime/api/internal/model"
	"github.com/sportime/api/internal/service"
)

type BookingHandler struct {
	db     *sql.DB
	tripay *service.TripayClient
	email  *service.EmailService
}

func NewBookingHandler(db *sql.DB, tripay *service.TripayClient, email *service.EmailService) *BookingHandler {
	return &BookingHandler{
		db:     db,
		tripay: tripay,
		email:  email,
	}
}

func generateIdempotencyKey() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 16)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

func mapPaymentMethod(code string) string {
	switch code {
	case "QRIS":
		return "QRIS2"
	case "BCA":
		return "BCAVA"
	case "MANDIRI":
		return "MANDIRIVA"
	case "BRI":
		return "BRIVA"
	case "BNI":
		return "BNIVA"
	case "BSI":
		return "BSIVA"
	case "PERMATA":
		return "PERMATAVA"
	default:
		return code
	}
}

func generateVerificationCode() string {
	const digits = "0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = digits[rand.Intn(len(digits))]
	}
	return string(b)
}

func (h *BookingHandler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := ctx.Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims.Role != "user" {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Unauthorized"})
		return
	}

	var req model.CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	if req.SlotID == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Slot ID wajib diisi"})
		return
	}

	if req.IdempotencyKey == "" {
		req.IdempotencyKey = generateIdempotencyKey()
	}

	var existingID string
	err := h.db.QueryRowContext(ctx, `SELECT id FROM bookings WHERE idempotency_key = $1`, req.IdempotencyKey).Scan(&existingID)
	if err == nil {
		writeJSON(w, http.StatusOK, model.APIResponse{
			Success: true,
			Message: "Booking sudah ada",
			Data:    map[string]interface{}{"booking_id": existingID},
		})
		return
	}

	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	var venueID, courtID string
	var price int64
	var slotDate, slotTime string
	err = tx.QueryRowContext(ctx, `
		SELECT s.court_id, c.venue_id, c.price_per_hour, s.date::text, s.start_time::text
		FROM slots s
		JOIN courts c ON c.id = s.court_id
		WHERE s.id = $1 AND s.status = 'available'
		FOR UPDATE
	`, req.SlotID).Scan(&courtID, &venueID, &price, &slotDate, &slotTime)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Slot tidak tersedia"})
		return
	}

	_, err = tx.ExecContext(ctx, `UPDATE slots SET status = 'booked' WHERE id = $1`, req.SlotID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengunci slot"})
		return
	}

	adminFee := int64(float64(price) * 0.05)
	mitraPayout := price - adminFee
	verificationCode := generateVerificationCode()

	tripayNetPrice := price
	tripayAdminFee := int64(float64(tripayNetPrice) * 0.05)

	if req.PromoCode != "" {
		var minAmount float64
		var discountPercent, maxDiscount float64
		err := h.db.QueryRowContext(ctx, `
			SELECT COALESCE(discount_percent,0), COALESCE(max_discount,0), COALESCE(min_booking_amount,0)
			FROM promo_codes
			WHERE code = $1 AND is_active = true AND (valid_until IS NULL OR valid_until > NOW())
			AND (max_uses = 0 OR max_uses > (SELECT COUNT(*) FROM bookings WHERE promo_code = $1))
		`, req.PromoCode).Scan(&discountPercent, &maxDiscount, &minAmount)
		if err == nil && float64(price) >= minAmount {
			discountAmount := int64(float64(price) * discountPercent / 100)
			if maxDiscount > 0 && float64(discountAmount) > maxDiscount {
				discountAmount = int64(maxDiscount)
			}
			tripayNetPrice = price - discountAmount
			tripayAdminFee = int64(float64(tripayNetPrice) * 0.05)
		}
	}

	tripayAmount := tripayNetPrice + tripayAdminFee

	var bookingID string
	if req.PromoCode != "" {
		err = tx.QueryRowContext(ctx, `
			INSERT INTO bookings (user_id, slot_id, court_id, venue_id, gross_amount, admin_fee, mitra_payout, status, idempotency_key, verification_code, promo_code, payment_method)
			VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11)
			RETURNING id
		`, claims.UserID, req.SlotID, courtID, venueID, price, adminFee, mitraPayout, req.IdempotencyKey, verificationCode, req.PromoCode, req.PaymentMethod).Scan(&bookingID)
	} else {
		err = tx.QueryRowContext(ctx, `
			INSERT INTO bookings (user_id, slot_id, court_id, venue_id, gross_amount, admin_fee, mitra_payout, status, idempotency_key, verification_code, payment_method)
			VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10)
			RETURNING id
		`, claims.UserID, req.SlotID, courtID, venueID, price, adminFee, mitraPayout, req.IdempotencyKey, verificationCode, req.PaymentMethod).Scan(&bookingID)
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal membuat booking"})
		return
	}

	tripayReq := service.TripayTransactionRequest{
		Method:        mapPaymentMethod(req.PaymentMethod),
		MerchantRef:   bookingID,
		Amount:        tripayAmount,
		CustomerName:  claims.FullName,
		CustomerEmail: claims.Email,
		CustomerPhone: "",
		OrderItems: []service.TripayItem{
			{Sku: venueID, Name: fmt.Sprintf("Booking %s %s %s", venueID, slotDate, slotTime), Price: tripayNetPrice, Quantity: 1},
			{Sku: "ADMIN", Name: "Biaya Layanan 5%", Price: tripayAdminFee, Quantity: 1},
		},
		ReturnURL:  os.Getenv("FRONTEND_URL") + "/booking-confirmation?id=" + bookingID,
		ExpiryTime: time.Now().Add(24 * time.Hour),
	}

	tripayData, err := h.tripay.CreateTransaction(tripayReq)
	if err != nil {
		fmt.Printf("[CreateBooking] Tripay error: %v | method=%s amount=%d\n", err, req.PaymentMethod, tripayAmount)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal membuat pembayaran"})
		return
	}

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal commit transaksi"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"booking_id": bookingID,
			"tripay":     tripayData,
			"amount":     tripayAmount,
		},
	})
}

func (h *BookingHandler) MockPayment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := ctx.Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims.Role != "user" {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Unauthorized"})
		return
	}

	var req struct {
		BookingID string `json:"booking_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}
	if req.BookingID == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Booking ID wajib diisi"})
		return
	}

	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	var currentStatus string
	err = tx.QueryRowContext(ctx, `SELECT status FROM bookings WHERE id = $1 AND user_id = $2 FOR UPDATE`,
		req.BookingID, claims.UserID).Scan(&currentStatus)
	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Booking tidak ditemukan"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data booking"})
		return
	}

	if currentStatus != "pending" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Booking sudah diproses"})
		return
	}

	_, err = tx.ExecContext(ctx, `UPDATE bookings SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1`, req.BookingID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal update booking"})
		return
	}

	var venueID, slotDate, slotTime string
	tx.QueryRowContext(ctx, `
		SELECT b.venue_id, sl.date::text, sl.start_time::text
		FROM bookings b JOIN slots sl ON sl.id = b.slot_id WHERE b.id = $1
	`, req.BookingID).Scan(&venueID, &slotDate, &slotTime)
	service.NotifyMitraByBooking(h.db, req.BookingID,
		fmt.Sprintf("Booking baru %s pada %s jam %s (mock payment)", venueID, slotDate, slotTime))

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal commit transaksi"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "Pembayaran berhasil (mock)"})
}

func (h *BookingHandler) GetBookings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := ctx.Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Unauthorized"})
		return
	}

	rows, err := h.db.QueryContext(ctx, `
		SELECT b.id, sl.date::text, sl.start_time::text, sl.end_time::text, b.gross_amount,
			b.status, b.booked_at::text, b.verification_code,
			v.image_urls, v.id, v.slug, v.name, v.address
		FROM bookings b
		JOIN slots sl ON sl.id = b.slot_id
		JOIN venues v ON v.id = b.venue_id
		WHERE b.user_id = $1
		ORDER BY b.booked_at DESC
	`, claims.UserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data booking"})
		return
	}
	defer rows.Close()

	var bookings []map[string]interface{}
	for rows.Next() {
		var id, slotDate, slotTime, slotEnd, status, bookedAt, verificationCode string
		var grossAmount int64
		var imageURLsRaw pq.StringArray
		var venueID, venueSlug, venueName, venueAddress string
		if err := rows.Scan(&id, &slotDate, &slotTime, &slotEnd, &grossAmount, &status, &bookedAt, &verificationCode,
			&imageURLsRaw, &venueID, &venueSlug, &venueName, &venueAddress); err != nil {
			continue
		}
		var venueImage string
		if len(imageURLsRaw) > 0 {
			venueImage = imageURLsRaw[0]
		}
		bookings = append(bookings, map[string]interface{}{
			"id":                id,
			"slot_date":         slotDate,
			"slot_time":         slotTime,
			"slot_time_end":     slotEnd,
			"gross_amount":      grossAmount,
			"status":            status,
			"booked_at":         bookedAt,
			"verification_code": verificationCode,
			"venue_id":          venueID,
			"venue_name":        venueName,
			"venue_address":     venueAddress,
			"venue_slug":        venueSlug,
			"venue_image":       venueImage,
		})
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    bookings,
	})
}

func (h *BookingHandler) GetBookingDetails(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bookingID := r.PathValue("id")
	if bookingID == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Booking ID wajib diisi"})
		return
	}

	claims, ok := ctx.Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Unauthorized"})
		return
	}

	var b model.Booking
	var endTime sql.NullString
	var imageURLsRaw pq.StringArray
	var bookingAdminFee int64
	err := h.db.QueryRowContext(ctx, `
		SELECT b.id, sl.date::text, sl.start_time::text, b.gross_amount, b.admin_fee, b.status, b.booked_at,
			b.verification_code,
			v.name, v.address,
			sl.end_time::text, v.image_urls
		FROM bookings b
		JOIN slots sl ON sl.id = b.slot_id
		JOIN venues v ON v.id = b.venue_id
		WHERE b.id = $1 AND b.user_id = $2
	`, bookingID, claims.UserID).Scan(
		&b.ID, &b.SlotDate, &b.SlotTime, &b.GrossAmount, &bookingAdminFee, &b.Status, &b.BookedAt,
		&b.VerificationCode, &b.VenueName, &b.VenueAddress, &endTime, &imageURLsRaw,
	)
	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Booking tidak ditemukan"})
		return
	}
	if err != nil {
		fmt.Printf("[GetBookingDetails] Error: %v\n", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil detail booking"})
		return
	}

	slotTimeEnd := endTime.String
	var venueImage string
	if len(imageURLsRaw) > 0 {
		venueImage = imageURLsRaw[0]
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"booking":    b,
			"admin_fee":  bookingAdminFee,
			"slot_end":   slotTimeEnd,
			"images":     imageURLsRaw,
			"venueImage": venueImage,
		},
	})
}

func (h *BookingHandler) ShareBooking(w http.ResponseWriter, r *http.Request) {
	bookingID := r.PathValue("id")
	if bookingID == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Booking ID wajib diisi"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "Booking dibagikan"})
}

func (h *BookingHandler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bookingID := r.PathValue("id")
	if bookingID == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Booking ID wajib diisi"})
		return
	}

	claims, ok := ctx.Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Unauthorized"})
		return
	}

	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	var currentStatus string
	err = tx.QueryRowContext(ctx, `SELECT status FROM bookings WHERE id = $1 AND user_id = $2 FOR UPDATE`,
		bookingID, claims.UserID).Scan(&currentStatus)
	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Booking tidak ditemukan"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data booking"})
		return
	}

	if currentStatus != "pending" && currentStatus != "confirmed" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Booking tidak dapat dibatalkan"})
		return
	}

	_, err = tx.ExecContext(ctx, `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1`, bookingID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal membatalkan booking"})
		return
	}

	_, err = tx.ExecContext(ctx, `UPDATE slots SET status = 'available' WHERE id = (SELECT slot_id FROM bookings WHERE id = $1)`, bookingID)
	if err != nil {
		fmt.Printf("[CancelBooking] Failed to release slot: %v\n", err)
	}

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal commit transaksi"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "Booking dibatalkan"})
}

func (h *BookingHandler) WebhookTripay(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Gagal membaca body"})
		return
	}
	defer r.Body.Close()

	var callback service.TripayCallbackBody
	if err := json.Unmarshal(body, &callback); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	signature := r.Header.Get("X-Callback-Signature")
	event := r.Header.Get("X-Callback-Event")

	if !h.tripay.ValidateCallback(signature, callback.MerchantRef, event, callback.TotalAmount) {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Signature tidak valid"})
		return
	}

	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memulai transaksi"})
		return
	}
	defer tx.Rollback()

	var currentStatus string
	err = tx.QueryRowContext(ctx, `SELECT status FROM bookings WHERE id = $1 FOR UPDATE`,
		callback.MerchantRef).Scan(&currentStatus)
	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Booking tidak ditemukan"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data booking"})
		return
	}

	if currentStatus == "confirmed" || currentStatus == "completed" {
		writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
		return
	}

	var newStatus string
	switch callback.Status {
	case "PAID":
		newStatus = "confirmed"
	case "EXPIRED":
		newStatus = "cancelled"
	case "FAILED":
		newStatus = "cancelled"
	default:
		newStatus = "pending"
	}

	if newStatus == "confirmed" {
		_, err = tx.ExecContext(ctx, `UPDATE bookings SET status = $1, confirmed_at = NOW(), payment_method = COALESCE(NULLIF($3, ''), payment_method) WHERE id = $2`,
			newStatus, callback.MerchantRef, callback.PaymentMethod)
	} else {
		_, err = tx.ExecContext(ctx, `UPDATE bookings SET status = $1, payment_method = COALESCE(NULLIF($3, ''), payment_method) WHERE id = $2`,
			newStatus, callback.MerchantRef, callback.PaymentMethod)
	}
	if err != nil {
		fmt.Printf("[WebhookTripay] Update failed: %v\n", err)
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal update booking"})
		return
	}

	if newStatus == "cancelled" {
		_, err = tx.ExecContext(ctx, `UPDATE slots SET status = 'available' WHERE id = (SELECT slot_id FROM bookings WHERE id = $1)`,
			callback.MerchantRef)
		if err != nil {
			fmt.Printf("[WebhookTripay] Failed to release slot: %v\n", err)
		}
	}

	if newStatus == "confirmed" {
		var venueID, slotDate, slotTime string
		tx.QueryRowContext(ctx, `
			SELECT b.venue_id, sl.date::text, sl.start_time::text
			FROM bookings b JOIN slots sl ON sl.id = b.slot_id WHERE b.id = $1
		`, callback.MerchantRef).Scan(&venueID, &slotDate, &slotTime)
		service.NotifyMitraByBooking(h.db, callback.MerchantRef,
			fmt.Sprintf("Booking baru %s pada %s jam %s", venueID, slotDate, slotTime))
	}

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal commit transaksi"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true})
}
