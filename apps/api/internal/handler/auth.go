package handler

import (
	"database/sql"
	"encoding/json"
	"net"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sportime/api/internal/middleware"
	"github.com/sportime/api/internal/model"
	"golang.org/x/crypto/bcrypt"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`)
	phoneRegex = regexp.MustCompile(`^[0-9]{10,15}`)
	nameRegex  = regexp.MustCompile(`^[a-zA-Z\s'.\-]+`)
)

const (
	maxFailedLogins = 5
	lockoutDuration = 15 * time.Minute
	bcryptCost      = 12
	maxBodySize     = 1 << 20
)

type AuthHandler struct {
	db         *sql.DB
	jwtSecret  string
	accessExp  time.Duration
	refreshExp time.Duration
}

func NewAuthHandler(db *sql.DB, jwtSecret string, accessExp, refreshExp time.Duration) *AuthHandler {
	return &AuthHandler{db: db, jwtSecret: jwtSecret, accessExp: accessExp, refreshExp: refreshExp}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)
	var req model.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid. Pastikan format JSON benar."})
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Phone = strings.TrimSpace(req.Phone)
	req.FullName = strings.TrimSpace(req.FullName)
	req.Address = strings.TrimSpace(req.Address)

	if req.Role == "" {
		req.Role = "user"
	}

	errors := []string{}

	if req.Email == "" {
		errors = append(errors, "Email wajib diisi")
	} else if !emailRegex.MatchString(req.Email) {
		errors = append(errors, "Format email tidak valid")
	} else if len(req.Email) > 255 {
		errors = append(errors, "Email terlalu panjang (maks 255 karakter)")
	}

	if req.Phone == "" {
		errors = append(errors, "Nomor telepon wajib diisi")
	} else if !phoneRegex.MatchString(req.Phone) {
		errors = append(errors, "Nomor telepon harus 10-15 digit angka (tanpa spasi/tanda)")
	}

	if req.FullName == "" {
		errors = append(errors, "Nama lengkap wajib diisi")
	} else if !nameRegex.MatchString(req.FullName) {
		errors = append(errors, "Nama lengkap hanya boleh mengandung huruf, spasi, titik, apostrof, dan strip")
	} else if len(req.FullName) > 255 {
		errors = append(errors, "Nama lengkap terlalu panjang (maks 255 karakter)")
	} else {
		words := strings.Fields(req.FullName)
		if len(words) < 2 {
			errors = append(errors, "Nama lengkap harus terdiri dari nama depan dan belakang")
		}
	}

	if req.Password == "" {
		errors = append(errors, "Password wajib diisi")
	} else {
		pwdErrors := validatePassword(req.Password)
		errors = append(errors, pwdErrors...)
	}

	if req.Address == "" {
		errors = append(errors, "Alamat wajib diisi untuk verifikasi data")
	} else if len(req.Address) < 10 {
		errors = append(errors, "Alamat terlalu singkat (minimal 10 karakter)")
	} else if len(req.Address) > 500 {
		errors = append(errors, "Alamat terlalu panjang (maks 500 karakter)")
	}

	if req.Role != "user" && req.Role != "mitra" {
		errors = append(errors, "Role harus 'user' atau 'mitra'")
	}

	if req.Role == "mitra" {
		if req.KTPNumber == "" {
			errors = append(errors, "Nomor KTP wajib diisi untuk pendaftaran mitra")
		} else if len(req.KTPNumber) != 16 {
			errors = append(errors, "Nomor KTP harus 16 digit")
		}
		if req.BankName == "" {
			errors = append(errors, "Nama bank wajib diisi untuk pendaftaran mitra")
		}
		if req.AccountNumber == "" {
			errors = append(errors, "Nomor rekening wajib diisi untuk pendaftaran mitra")
		}
		if req.AccountHolder == "" {
			errors = append(errors, "Nama pemilik rekening wajib diisi")
		}
	}

	if len(errors) > 0 {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{
			Success: false,
			Error:   "Validasi gagal",
			Data: map[string]interface{}{
				"validation_errors": errors,
			},
		})
		return
	}

	var existingField string
	err := h.db.QueryRow(`
		SELECT CASE
			WHEN email = $1 THEN 'email'
			WHEN phone = $2 THEN 'phone'
		END
		FROM users WHERE email = $1 OR phone = $2 LIMIT 1
	`, req.Email, req.Phone).Scan(&existingField)
	if err == nil {
		msg := "Email sudah terdaftar. Silakan gunakan email lain atau login."
		if existingField == "phone" {
			msg = "Nomor telepon sudah terdaftar. Silakan gunakan nomor lain atau login."
		}
		writeJSON(w, http.StatusConflict, model.APIResponse{Success: false, Error: msg})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Terjadi kesalahan server"})
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Terjadi kesalahan server"})
		return
	}
	defer tx.Rollback()

	var user model.User
	err = tx.QueryRow(`
		INSERT INTO users (email, phone, password_hash, full_name, role, address, ktp_number)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, email, phone, full_name, role, is_verified, created_at, updated_at, login_count, is_suspended
	`, req.Email, req.Phone, string(hash), req.FullName, req.Role, req.Address, nullString(req.KTPNumber)).Scan(
		&user.ID, &user.Email, &user.Phone, &user.FullName, &user.Role,
		&user.IsVerified, &user.CreatedAt, &user.UpdatedAt, &user.LoginCount, &user.IsSuspended,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal membuat akun. Silakan coba lagi."})
		return
	}

	if req.Role == "mitra" {
		_, err = tx.Exec(`
			INSERT INTO mitra_settings (user_id, bank_name, account_number, account_holder, wa_number)
			VALUES ($1, $2, $3, $4, $5)
		`, user.ID, req.BankName, req.AccountNumber, req.AccountHolder, req.Phone)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal menyimpan data mitra"})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Terjadi kesalahan server"})
		return
	}

	accessToken, err := middleware.GenerateAccessToken(&user, h.jwtSecret, h.accessExp)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Terjadi kesalahan server"})
		return
	}
	refreshToken, err := middleware.GenerateRefreshToken(&user, h.jwtSecret, h.refreshExp)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Terjadi kesalahan server"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Message: "Registrasi berhasil",
		Data: map[string]interface{}{
			"user":          user,
			"access_token":  accessToken,
			"refresh_token": refreshToken,
		},
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	var user model.User
	err := h.db.QueryRow(`
		SELECT id, email, phone, password_hash, full_name, role, is_verified, is_suspended,
			login_count, last_login_at, created_at, updated_at
		FROM users WHERE email = $1
	`, req.Email).Scan(
		&user.ID, &user.Email, &user.Phone, &user.PasswordHash, &user.FullName, &user.Role,
		&user.IsVerified, &user.IsSuspended, &user.LoginCount, &user.LastLoginAt,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{
			Success: false, Error: "Email atau password salah",
		})
		return
	}

	if user.IsSuspended {
		writeJSON(w, http.StatusForbidden, model.APIResponse{
			Success: false, Error: "Akun Anda telah ditangguhkan. Silakan hubungi admin.",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		h.db.Exec(`UPDATE users SET login_count = login_count + 1 WHERE id = $1`, user.ID)
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{
			Success: false, Error: "Email atau password salah",
		})
		return
	}

	h.db.Exec(`UPDATE users SET login_count = 0, last_login_at = NOW() WHERE id = $1`, user.ID)

	accessToken, err := middleware.GenerateAccessToken(&user, h.jwtSecret, h.accessExp)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Terjadi kesalahan server"})
		return
	}
	refreshToken, err := middleware.GenerateRefreshToken(&user, h.jwtSecret, h.refreshExp)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Terjadi kesalahan server"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Message: "Login berhasil",
		Data: map[string]interface{}{
			"user":          user,
			"access_token":  accessToken,
			"refresh_token": refreshToken,
		},
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Unauthorized"})
		return
	}

	var user model.User
	err := h.db.QueryRow(`
		SELECT id, email, phone, full_name, role, is_verified, created_at, updated_at
		FROM users WHERE id = $1
	`, claims.UserID).Scan(
		&user.ID, &user.Email, &user.Phone, &user.FullName, &user.Role,
		&user.IsVerified, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "User tidak ditemukan"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    user,
	})
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Unauthorized"})
		return
	}

	var req model.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	req.FullName = strings.TrimSpace(req.FullName)
	req.Phone = strings.TrimSpace(req.Phone)

	if req.Phone != "" {
		var existing string
		err := h.db.QueryRow(`SELECT id FROM users WHERE phone = $1 AND id != $2`, req.Phone, claims.UserID).Scan(&existing)
		if err == nil {
			writeJSON(w, http.StatusConflict, model.APIResponse{
				Success: false, Error: "Nomor telepon sudah digunakan oleh pengguna lain",
			})
			return
		}
	}

	_, err := h.db.Exec(`
		UPDATE users SET full_name = $1, phone = $2, address = $3, updated_at = NOW()
		WHERE id = $4
	`, req.FullName, req.Phone, nullString(req.Address), claims.UserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal memperbarui profil"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Message: "Profil berhasil diperbarui",
	})
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Data tidak valid"})
		return
	}

	if req.RefreshToken == "" {
		req.RefreshToken = r.URL.Query().Get("refresh_token")
	}

	token, err := jwt.ParseWithClaims(req.RefreshToken, &middleware.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Refresh token tidak valid"})
		return
	}

	claims, ok := token.Claims.(*middleware.JWTClaims)
	if !ok || !token.Valid {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Refresh token tidak valid"})
		return
	}

	if claims.Issuer != "sportime-api-refresh" {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Refresh token tidak valid"})
		return
	}

	var user model.User
	err = h.db.QueryRow(`
		SELECT id, email, phone, full_name, role, is_verified, is_suspended
		FROM users WHERE id = $1
	`, claims.UserID).Scan(
		&user.ID, &user.Email, &user.Phone, &user.FullName, &user.Role,
		&user.IsVerified, &user.IsSuspended,
	)
	if err != nil || user.IsSuspended {
		writeJSON(w, http.StatusUnauthorized, model.APIResponse{Success: false, Error: "Akun tidak ditemukan atau ditangguhkan"})
		return
	}

	accessToken, err := middleware.GenerateAccessToken(&user, h.jwtSecret, h.accessExp)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Terjadi kesalahan server"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"access_token": accessToken,
		},
	})
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.SplitN(xff, ",", 2)[0]
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func nullString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func validatePassword(password string) []string {
	var errors []string
	if len(password) < 8 {
		errors = append(errors, "Password minimal 8 karakter")
	}
	if len(password) > 128 {
		errors = append(errors, "Password maksimal 128 karakter")
	}
	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		case unicode.IsPunct(ch) || unicode.IsSymbol(ch):
			hasSpecial = true
		}
	}
	if !hasUpper {
		errors = append(errors, "Password harus mengandung huruf kapital")
	}
	if !hasLower {
		errors = append(errors, "Password harus mengandung huruf kecil")
	}
	if !hasDigit {
		errors = append(errors, "Password harus mengandung angka")
	}
	if !hasSpecial {
		errors = append(errors, "Password harus mengandung karakter khusus")
	}
	return errors
}
