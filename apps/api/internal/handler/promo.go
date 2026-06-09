package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/sportime/api/internal/model"
)

type PromoHandler struct {
	db *sql.DB
}

func NewPromoHandler(db *sql.DB,
) *PromoHandler {

	return &PromoHandler{db: db}

}

// POST /api/promo/validate
func (h *PromoHandler) ValidatePromoCode(w http.ResponseWriter, r *http.Request) {

	var req struct {
		Code   string  `json:"code"`
		Amount float64 `json:"amount"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	if req.Code == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Kode promo wajib diisi"})
		return
	}

	var promo struct {
		ID              string  `json:"id"`
		Code            string  `json:"code"`
		DiscountPercent float64 `json:"discount_percent"`
		MaxDiscount     float64 `json:"max_discount"`
		MinAmount       float64 `json:"min_amount"`
		ValidUntil      string  `json:"valid_until"`
		MaxUses         int     `json:"max_uses"`
	}

	err := h.db.QueryRowContext(r.Context(), `
		SELECT id, code, discount_percent, COALESCE(max_discount,0), COALESCE(min_booking_amount,0),
			valid_until, COALESCE(max_uses,0)
		FROM promo_codes
		WHERE code = $1 AND is_active = true AND (valid_until IS NULL OR valid_until > NOW())
		AND (max_uses = 0 OR max_uses > (SELECT COUNT(*) FROM bookings WHERE promo_code = $1))
	`, req.Code).Scan(
		&promo.ID, &promo.Code, &promo.DiscountPercent, &promo.MaxDiscount,
		&promo.MinAmount, &promo.ValidUntil, &promo.MaxUses,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Kode promo tidak valid atau sudah kadaluwarsa"})
		} else {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memvalidasi kode promo"})
		}
		return
	}

	if req.Amount < promo.MinAmount {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("Minimal pemesanan Rp%.0f untuk menggunakan kode ini", promo.MinAmount),
		})
		return
	}

	discountAmount := req.Amount * promo.DiscountPercent / 100
	if promo.MaxDiscount > 0 && discountAmount > promo.MaxDiscount {
		discountAmount = promo.MaxDiscount
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"discount_amount": discountAmount,
		},
	})
}
