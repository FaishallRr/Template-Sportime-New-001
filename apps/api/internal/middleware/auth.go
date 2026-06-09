package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sportime/api/internal/model"
)

type contextKey string

const (
	UserContextKey contextKey = "user"
)

type JWTClaims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	FullName string `json:"full_name"`
	jwt.RegisteredClaims
}

func GenerateAccessToken(user *model.User, secret string, expiry time.Duration) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Email:    user.Email,
		Role:     user.Role,
		FullName: user.FullName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "sportime-api",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func GenerateRefreshToken(user *model.User, secret string, expiry time.Duration) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Email:    user.Email,
		Role:     user.Role,
		FullName: user.FullName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "sportime-api-refresh",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func Auth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				writeJSON(w, http.StatusUnauthorized, model.APIResponse{
					Success: false, Error: "Authorization header required",
				})
				return
			}
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				writeJSON(w, http.StatusUnauthorized, model.APIResponse{
					Success: false, Error: "Invalid authorization format",
				})
				return
			}
			tokenStr := parts[1]
			claims := &JWTClaims{}
			token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			})
			if err != nil || !token.Valid {
				writeJSON(w, http.StatusUnauthorized, model.APIResponse{
					Success: false, Error: "Invalid or expired token",
				})
				return
			}
			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*JWTClaims)
			if !ok {
				writeJSON(w, http.StatusUnauthorized, model.APIResponse{
					Success: false, Error: "Unauthorized",
				})
				return
			}
			allowed := false
			for _, role := range roles {
				if claims.Role == role {
					allowed = true
					break
				}
			}
			if !allowed {
				writeJSON(w, http.StatusForbidden, model.APIResponse{
					Success: false, Error: "Insufficient permissions",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
