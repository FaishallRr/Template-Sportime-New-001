package config

import (
	"os"

	"strconv"

	"time"
)

type Config struct {
	App AppConfig

	DB DBConfig

	JWT JWTConfig

	Tripay TripayConfig

	Security SecurityConfig

	Email EmailConfig
}

type EmailConfig struct {
	SMTPHost string

	SMTPPort string

	SMTPUser string

	SMTPPassword string

	FromAddress string

	FromName string
}

type AppConfig struct {
	Env string

	Port string
}

type DBConfig struct {
	Host string

	Port string

	User string

	Password string

	DBName string

	SSLMode string
}

type JWTConfig struct {
	Secret string

	AccessExpiry time.Duration

	RefreshExpiry time.Duration
}

type TripayConfig struct {
	APIKey string

	PrivateKey string

	MerchantCode string

	IsProduction bool
}

type SecurityConfig struct {
	FrontendURL string

	RateLimitRPS int

	SlotLockMinutes int

	WithdrawalFeePercent float64
}

func Load() *Config {
	return &Config{
		App: AppConfig{
			Env:  getEnv("APP_ENV", "development"),
			Port: getEnv("APP_PORT", "8080"),
		},
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "padel"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "padelpoint"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:        getEnv("JWT_SECRET", ""),
			AccessExpiry:  parseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m")),
			RefreshExpiry: parseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h")),
		},
		Tripay: TripayConfig{
			APIKey:       getEnv("TRIPAY_API_KEY", ""),
			PrivateKey:   getEnv("TRIPAY_PRIVATE_KEY", ""),
			MerchantCode: getEnv("TRIPAY_MERCHANT_CODE", ""),
			IsProduction: getEnv("TRIPAY_IS_PRODUCTION", "false") == "true",
		},
		Security: SecurityConfig{
			FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:3000"),
			RateLimitRPS:         parseInt(getEnv("RATE_LIMIT_RPS", "10")),
			SlotLockMinutes:      parseInt(getEnv("SLOT_LOCK_MINUTES", "10")),
			WithdrawalFeePercent: parseFloat(getEnv("WITHDRAWAL_FEE_PERCENT", "2")),
		},
		Email: EmailConfig{
			SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:     getEnv("SMTP_PORT", "587"),
			SMTPUser:     getEnv("SMTP_USER", ""),
			SMTPPassword: getEnv("SMTP_PASSWORD", ""),
			FromAddress:  getEnv("EMAIL_FROM_ADDRESS", ""),
			FromName:     getEnv("EMAIL_FROM_NAME", "SportTime"),
		},
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func parseInt(val string) int {
	n, err := strconv.Atoi(val)
	if err != nil {
		return 0
	}
	return n
}

func parseFloat(val string) float64 {
	f, err := strconv.ParseFloat(val, 64)
	if err != nil {
		return 0
	}
	return f
}

func parseDuration(val string) time.Duration {
	d, err := time.ParseDuration(val)
	if err != nil {
		return 0
	}
	return d
}
