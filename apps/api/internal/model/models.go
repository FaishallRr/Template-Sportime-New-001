package model

import (
	"time"
)

// ── User ──
type User struct {
	ID string `json:"id"`

	Email string `json:"email"`

	Phone string `json:"phone"`

	PasswordHash string `json:"-"`

	FullName string `json:"full_name"`

	Role string `json:"role"`

	IsVerified bool `json:"is_verified"`

	VerifiedAt *time.Time `json:"verified_at,omitempty"`

	KTPNumber *string `json:"-"`

	KTPPhotoURL *string `json:"ktp_photo_url,omitempty"`

	AvatarURL *string `json:"avatar_url,omitempty"`

	Address *string `json:"address,omitempty"`

	CreatedAt time.Time `json:"created_at"`

	UpdatedAt time.Time `json:"updated_at"`

	LastLoginAt *time.Time `json:"last_login_at,omitempty"`

	LoginCount int `json:"login_count"`

	IsSuspended bool `json:"is_suspended"`

	SuspendReason *string `json:"suspend_reason,omitempty"`
}

// ── Auth DTOs ──
type RegisterRequest struct {
	Email string `json:"email" validate:"required,email"`

	Phone string `json:"phone" validate:"required,min=10,max=15"`

	Password string `json:"password" validate:"required,min=8"`

	FullName string `json:"full_name" validate:"required,min=2,max=150"`

	Role string `json:"role" validate:"required,oneof=user mitra"`

	Address string `json:"address"`

	// Mitra-specific fields

	KTPNumber string `json:"ktp_number,omitempty"`

	BankName string `json:"bank_name,omitempty"`

	AccountNumber string `json:"account_number,omitempty"`

	AccountHolder string `json:"account_holder,omitempty"`
}

type LoginRequest struct {
	Email string `json:"email" validate:"required,email"`

	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`

	RefreshToken string `json:"refresh_token"`

	ExpiresIn int64 `json:"expires_in"`

	User User `json:"user"`
}

type UpdateProfileRequest struct {
	FullName string `json:"full_name"`

	Phone string `json:"phone"`

	Address string `json:"address"`
}

// ── Venue ──
type Venue struct {
	ID string `json:"id"`

	MitraID string `json:"mitra_id"`

	Name string `json:"name"`

	Slug string `json:"slug"`

	Address string `json:"address"`

	Latitude float64 `json:"latitude"`

	Longitude float64 `json:"longitude"`

	Description *string `json:"description,omitempty"`

	Facilities []string `json:"facilities"`

	ImageURLs []string `json:"image_urls"`

	Status string `json:"status"`

	SportType string `json:"sport_type"`

	RatingAvg float64 `json:"rating_avg"`

	ReviewCount int `json:"review_count"`

	CreatedAt time.Time `json:"created_at"`

	UpdatedAt time.Time `json:"updated_at"`

	// Joined

	Courts []Court `json:"courts,omitempty"`

	Distance *float64 `json:"distance_km,omitempty"`
}

// ── Court ──
type Court struct {
	ID string `json:"id"`

	VenueID string `json:"venue_id"`

	Name string `json:"name"`

	PricePerHour int64 `json:"price_per_hour"`

	Status string `json:"status"`

	CreatedAt time.Time `json:"created_at"`
}

// ── Slot ──
type Slot struct {
	ID string `json:"id"`

	CourtID string `json:"court_id"`

	Date string `json:"date"`

	StartTime string `json:"start_time"`

	EndTime string `json:"end_time"`

	Status string `json:"status"`

	LockedBy *string `json:"locked_by,omitempty"`

	LockedAt *time.Time `json:"locked_at,omitempty"`

	// Joined

	CourtName string `json:"court_name,omitempty"`

	PricePerHour int64 `json:"price_per_hour,omitempty"`
}

// ── Booking ──
type Booking struct {
	ID string `json:"id"`

	IdempotencyKey string `json:"idempotency_key"`

	UserID string `json:"user_id"`

	SlotID string `json:"slot_id"`

	CourtID string `json:"court_id"`

	VenueID string `json:"venue_id"`

	GrossAmount int64 `json:"gross_amount"`

	AdminFee int64 `json:"admin_fee"`

	MitraPayout int64 `json:"mitra_payout"`

	Status string `json:"status"`

	VerificationCode string `json:"verification_code"`

	QRCodeURL *string `json:"qr_code_url,omitempty"`

	BookedAt time.Time `json:"booked_at"`

	ConfirmedAt *time.Time `json:"confirmed_at,omitempty"`

	CompletedAt *time.Time `json:"completed_at,omitempty"`

	CancelledAt *time.Time `json:"cancelled_at,omitempty"`

	CancelReason *string `json:"cancel_reason,omitempty"`

	// Joined

	VenueName string `json:"venue_name,omitempty"`

	VenueSlug string `json:"venue_slug,omitempty"`

	VenueAddress string `json:"venue_address,omitempty"`

	CourtName string `json:"court_name,omitempty"`

	UserName string `json:"user_name,omitempty"`

	SlotDate string `json:"slot_date,omitempty"`

	SlotTime string `json:"slot_time,omitempty"`
}

type CreateBookingRequest struct {
	SlotID string `json:"slot_id" validate:"required,uuid"`

	IdempotencyKey string `json:"idempotency_key" validate:"required,uuid"`

	PromoCode string `json:"promo_code,omitempty"`

	PaymentMethod string `json:"payment_method,omitempty"`
}

// ── Payment ──
type Payment struct {
	ID string `json:"id"`

	BookingID string `json:"booking_id"`

	TripayReference string `json:"tripay_reference,omitempty"`

	TripayTxnID *string `json:"tripay_txn_id,omitempty"`

	PaymentType *string `json:"payment_type,omitempty"`

	PaymentMethod *string `json:"payment_method,omitempty"`

	GrossAmount int64 `json:"gross_amount"`

	Status string `json:"status"`

	CreatedAt time.Time `json:"created_at"`

	PaidAt *time.Time `json:"paid_at,omitempty"`

	ExpiredAt *time.Time `json:"expired_at,omitempty"`
}

// ── Review ──
type Review struct {
	ID string `json:"id"`

	BookingID string `json:"booking_id"`

	UserID string `json:"user_id"`

	VenueID string `json:"venue_id"`

	Rating int `json:"rating"`

	Comment *string `json:"comment,omitempty"`

	PhotoURLs []string `json:"photo_urls"`

	ReplyText *string `json:"reply_text,omitempty"`

	RepliedAt *time.Time `json:"replied_at,omitempty"`

	IsFlagged bool `json:"is_flagged"`

	FlagReason *string `json:"flag_reason,omitempty"`

	IsVisible bool `json:"is_visible"`

	CreatedAt time.Time `json:"created_at"`

	// Joined

	UserName string `json:"user_name,omitempty"`

	VenueName string `json:"venue_name,omitempty"`

	UserInitials string `json:"user_initials,omitempty"`
}

type CreateReviewRequest struct {
	BookingID string `json:"booking_id" validate:"required,uuid"`

	Rating int `json:"rating" validate:"required,min=1,max=5"`

	Comment string `json:"comment" validate:"max=1000"`
}

// ── Mitra Settings ──
type MitraSettings struct {
	ID string `json:"id"`

	UserID string `json:"user_id"`

	BankName string `json:"bank_name"`

	AccountNumber string `json:"account_number"`

	AccountHolder string `json:"account_holder"`

	IsVerified bool `json:"is_verified"`

	VerifiedAt *time.Time `json:"verified_at,omitempty"`

	MidtransSubAccountID *string `json:"midtrans_sub_account_id,omitempty"`

	WANumber *string `json:"wa_number,omitempty"`

	NotifyBooking bool `json:"notify_booking"`

	NotifyPayment bool `json:"notify_payment"`

	NotifyReview bool `json:"notify_review"`

	NotifyDaily bool `json:"notify_daily"`

	DailyReportTime string `json:"daily_report_time"`
}

// ── Withdrawal ──
type Withdrawal struct {
	ID string `json:"id"`

	MitraID string `json:"mitra_id"`

	Amount int64 `json:"amount"`

	BankName string `json:"bank_name"`

	AccountNumber string `json:"account_number"`

	Status string `json:"status"`

	ProcessedBy *string `json:"processed_by,omitempty"`

	ProcessedAt *time.Time `json:"processed_at,omitempty"`

	RejectReason *string `json:"reject_reason,omitempty"`

	CreatedAt time.Time `json:"created_at"`

	// Joined

	MitraName string `json:"mitra_name,omitempty"`
}

// ── API Common ──
type APIResponse struct {
	Success bool `json:"success"`

	Message string `json:"message,omitempty"`

	Data interface{} `json:"data,omitempty"`

	Error string `json:"error,omitempty"`

	Total int `json:"total,omitempty"`

	Page int `json:"page,omitempty"`

	PerPage int `json:"per_page,omitempty"`
}

type PaginationRequest struct {
	Page int `json:"page" validate:"min=1"`

	PerPage int `json:"per_page" validate:"min=1,max=100"`
}

type PaginatedResponse struct {
	Data interface{} `json:"data"`

	Total int `json:"total"`

	Page int `json:"page"`

	PerPage int `json:"per_page"`

	TotalPages int `json:"total_pages"`
}

// ── Dashboard Stats ──
type AdminDashboardStats struct {
	PlatformRevenue int64 `json:"platform_revenue"`

	ActiveBookings int `json:"active_bookings"`

	TotalUsers int `json:"total_users"`

	ActiveMitra int `json:"active_mitra"`

	PendingMitra int `json:"pending_mitra"`

	FlaggedReviews int `json:"flagged_reviews"`
}

type MitraDashboardStats struct {
	TodayRevenue int64 `json:"today_revenue"`

	TodayBookings int `json:"today_bookings"`

	UpcomingBookings int `json:"upcoming_bookings"`

	AverageRating float64 `json:"average_rating"`

	MonthRevenue int64 `json:"month_revenue"`

	TotalRevenue int64 `json:"total_revenue"`
}
