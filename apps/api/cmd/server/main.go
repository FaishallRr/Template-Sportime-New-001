package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/sportime/api/internal/config"
	"github.com/sportime/api/internal/database"
	"github.com/sportime/api/internal/handler"
	"github.com/sportime/api/internal/middleware"
	"github.com/sportime/api/internal/service"
)

func main() {
	godotenv.Load()

	cfg := config.Load()

	db := database.Connect(&cfg.DB)
	defer db.Close()

	tripay := service.NewTripayClient()
	emailSvc := service.NewEmailService(service.EmailConfig{
		SMTPHost:     cfg.Email.SMTPHost,
		SMTPPort:     cfg.Email.SMTPPort,
		SMTPUser:     cfg.Email.SMTPUser,
		SMTPPassword: cfg.Email.SMTPPassword,
		FromAddress:  cfg.Email.FromAddress,
		FromName:     cfg.Email.FromName,
	})

	authHandler := handler.NewAuthHandler(db, cfg.JWT.Secret, cfg.JWT.AccessExpiry, cfg.JWT.RefreshExpiry)
	bookingHandler := handler.NewBookingHandler(db, tripay, emailSvc)
	venueHandler := handler.NewVenueHandler(db)
	promoHandler := handler.NewPromoHandler(db)
	mitraHandler := handler.NewMitraHandler(db, cfg)
	dashHandler := handler.NewDashboardHandler(db, cfg)
	cronSvc := service.NewCronService(db)
	cronSvc.StartAll()

	rps := float64(cfg.Security.RateLimitRPS) // from config (default 10)
	limiter := middleware.NewRateLimiter(int(rps))

	authUser := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(cfg.JWT.Secret)(h).ServeHTTP
	}
	authMitra := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(cfg.JWT.Secret)(middleware.RequireRole("mitra")(h)).ServeHTTP
	}
	authAdmin := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(cfg.JWT.Secret)(middleware.RequireRole("admin")(h)).ServeHTTP
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", venueHandler.Health)

	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("GET /api/auth/me", authUser(authHandler.Me))
	mux.HandleFunc("PUT /api/auth/profile", authUser(authHandler.UpdateProfile))
	mux.HandleFunc("POST /api/auth/refresh", authHandler.RefreshToken)

	mux.HandleFunc("GET /api/venues", venueHandler.List)
	mux.HandleFunc("GET /api/venues/{id}", venueHandler.Get)
	mux.HandleFunc("GET /api/venues/{id}/slots", venueHandler.GetSlots)
	mux.HandleFunc("GET /api/venues/{id}/reviews", venueHandler.VenueReviews)

	mux.HandleFunc("POST /api/bookings", authUser(bookingHandler.CreateBooking))
	mux.HandleFunc("GET /api/bookings", authUser(bookingHandler.GetBookings))
	mux.HandleFunc("GET /api/bookings/{id}", authUser(bookingHandler.GetBookingDetails))
	mux.HandleFunc("POST /api/bookings/{id}/cancel", authUser(bookingHandler.CancelBooking))
	mux.HandleFunc("POST /api/bookings/{id}/share", authUser(bookingHandler.ShareBooking))
	mux.HandleFunc("POST /api/bookings/mock-payment", authUser(bookingHandler.MockPayment))

	mux.HandleFunc("POST /api/webhook/tripay", bookingHandler.WebhookTripay)

	mux.HandleFunc("POST /api/promo/validate", authUser(promoHandler.ValidatePromoCode))

	mux.HandleFunc("GET /api/mitra/dashboard", authMitra(dashHandler.MitraStats))
	mux.HandleFunc("GET /api/mitra/bookings", authMitra(dashHandler.MitraBookings))
	mux.HandleFunc("GET /api/mitra/revenue", authMitra(dashHandler.MitraRevenue))
	mux.HandleFunc("GET /api/mitra/revenue/daily", authMitra(mitraHandler.DailyRevenue))
	mux.HandleFunc("GET /api/mitra/venues", authMitra(mitraHandler.ListVenues))
	mux.HandleFunc("POST /api/mitra/venues", authMitra(mitraHandler.CreateVenue))
	mux.HandleFunc("PUT /api/mitra/venues/{id}", authMitra(mitraHandler.UpdateVenue))
	mux.HandleFunc("DELETE /api/mitra/venues/{id}", authMitra(mitraHandler.DeleteVenue))
	mux.HandleFunc("GET /api/mitra/slots", authMitra(mitraHandler.ListSlots))
	mux.HandleFunc("POST /api/mitra/slots/generate", authMitra(mitraHandler.GenerateSlots))
	mux.HandleFunc("POST /api/mitra/slots/{id}", authMitra(mitraHandler.ToggleSlot))
	mux.HandleFunc("GET /api/mitra/transactions", authMitra(mitraHandler.MitraTransactions))
	mux.HandleFunc("GET /api/mitra/withdrawals", authMitra(mitraHandler.MitraWithdrawals))
	mux.HandleFunc("POST /api/mitra/withdrawals", authMitra(mitraHandler.CreateWithdrawal))
	mux.HandleFunc("GET /api/mitra/reviews", authMitra(mitraHandler.MitraReviews))
	mux.HandleFunc("POST /api/mitra/reviews/{id}/reply", authMitra(mitraHandler.ReplyReview))
	mux.HandleFunc("GET /api/mitra/settings", authMitra(mitraHandler.ProfileSettings))
	mux.HandleFunc("POST /api/mitra/settings", authMitra(mitraHandler.ProfileSettings))
	mux.HandleFunc("GET /api/mitra/notifications", authMitra(mitraHandler.MitraNotifications))

	mux.HandleFunc("GET /api/admin/dashboard", authAdmin(dashHandler.AdminStats))
	mux.HandleFunc("GET /api/admin/revenue-chart", authAdmin(dashHandler.RevenueChart))
	mux.HandleFunc("GET /api/admin/recent-bookings", authAdmin(dashHandler.RecentBookings))
	mux.HandleFunc("GET /api/admin/transactions", authAdmin(dashHandler.AdminTransactions))
	mux.HandleFunc("GET /api/admin/mitras", authAdmin(mitraHandler.AdminMitras))
	mux.HandleFunc("PATCH /api/admin/mitras/{id}/status", authAdmin(mitraHandler.UpdateMitraStatus))
	mux.HandleFunc("GET /api/admin/reviews", authAdmin(mitraHandler.AdminReviews))
	mux.HandleFunc("PATCH /api/admin/reviews/{id}", authAdmin(mitraHandler.AdminReviewPatch))
	mux.HandleFunc("GET /api/admin/withdrawals", authAdmin(mitraHandler.AdminWithdrawals))
	mux.HandleFunc("PATCH /api/admin/withdrawals/{id}/approve", authAdmin(mitraHandler.ApproveWithdrawal))
	mux.HandleFunc("PATCH /api/admin/withdrawals/{id}/reject", authAdmin(mitraHandler.RejectWithdrawal))
	mux.HandleFunc("GET /api/admin/venues/deleted", authAdmin(mitraHandler.ListDeletedVenues))
	mux.HandleFunc("POST /api/admin/venues/{id}/restore", authAdmin(mitraHandler.RestoreVenue))
	mux.HandleFunc("GET /api/admin/users", authAdmin(mitraHandler.ListUsers))
	mux.HandleFunc("PATCH /api/admin/users/{id}/suspend", authAdmin(mitraHandler.ToggleUserSuspend))
	mux.HandleFunc("PATCH /api/admin/bookings/{id}/cancel", authAdmin(mitraHandler.AdminCancelBooking))
	mux.HandleFunc("PATCH /api/admin/venues/{id}/status", authAdmin(mitraHandler.AdminUpdateVenueStatus))
	mux.HandleFunc("GET /api/admin/promo-codes", authAdmin(mitraHandler.AdminListPromoCodes))
	mux.HandleFunc("POST /api/admin/promo-codes", authAdmin(mitraHandler.AdminCreatePromoCode))
	mux.HandleFunc("PUT /api/admin/promo-codes/{id}", authAdmin(mitraHandler.AdminUpdatePromoCode))
	mux.HandleFunc("DELETE /api/admin/promo-codes/{id}", authAdmin(mitraHandler.AdminDeletePromoCode))
	mux.HandleFunc("GET /api/admin/audit-logs", authAdmin(mitraHandler.AdminAuditLogs))

	withTimeout := middleware.Timeout(30 * time.Second)(mux)
	wrapped := middleware.Logger(middleware.CORS(cfg.Security.FrontendURL)(limiter.Limit(middleware.Gzip(withTimeout))))

	srv := &http.Server{
		Addr:         ":" + cfg.App.Port,
		Handler:      wrapped,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server running on port %s", cfg.App.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}
