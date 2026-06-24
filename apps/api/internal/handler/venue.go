package handler

import (
	"database/sql"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/lib/pq"
	"github.com/sportime/api/internal/model"
)

type VenueHandler struct {
	db *sql.DB
}

func NewVenueHandler(db *sql.DB) *VenueHandler {
	return &VenueHandler{db: db}
}

const venueColumns = `id, name, COALESCE(slug, ''), address, latitude, longitude, description,
	facilities, image_urls, status, sport_type, rating_avg, review_count,
	created_at, updated_at,
	(SELECT COALESCE(MIN(price_per_hour), 0) FROM courts WHERE venue_id = venues.id) AS min_price`

type venueCacheEntry struct {
	data      []model.Venue
	total     int
	expiresAt time.Time
}

var (
	venueCache   sync.Map
	cacheTTL     = 10 * time.Second
)

func getCacheKey(status, sport string) string {
	return status + "|" + sport
}

func (h *VenueHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()
	status := q.Get("status")
	latStr := q.Get("lat")
	lngStr := q.Get("lng")
	sport := q.Get("sport")

	if status == "" {
		status = "active"
	}

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	var lat, lng float64
	var err error
	if latStr != "" && lngStr != "" {
		lat, err = strconv.ParseFloat(latStr, 64)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Latitude tidak valid"})
			return
		}
		lng, err = strconv.ParseFloat(lngStr, 64)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "Longitude tidak valid"})
			return
		}
	}

	cacheKey := getCacheKey(status, sport)
	var venues []model.Venue
	var total int

	// Try cache (only when no location filter)
	if lat == 0 && lng == 0 {
		if entry, ok := venueCache.Load(cacheKey); ok {
			cached := entry.(*venueCacheEntry)
			if time.Now().Before(cached.expiresAt) {
				// Apply pagination on cached data
				if offset < len(cached.data) {
					end := offset + limit
					if end > len(cached.data) {
						end = len(cached.data)
					}
					venues = cached.data[offset:end]
				} else {
					venues = []model.Venue{}
				}
				total = cached.total
				writeJSON(w, http.StatusOK, model.APIResponse{
					Success: true,
					Data:    venues,
					Total:   total,
					Page:    page,
					PerPage: limit,
				})
				return
			}
		}
	}

	var rows *sql.Rows
	if sport != "" {
		rows, err = h.db.QueryContext(ctx, fmt.Sprintf(`
			SELECT %s FROM venues
			WHERE status = $1 AND sport_type = $2
			ORDER BY created_at DESC
			LIMIT $3 OFFSET $4
		`, venueColumns), status, sport, limit, offset)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data venue"})
			return
		}
		h.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM venues WHERE status = $1 AND sport_type = $2`, status, sport).Scan(&total)
	} else {
		rows, err = h.db.QueryContext(ctx, fmt.Sprintf(`
			SELECT %s FROM venues
			WHERE status = $1
			ORDER BY created_at DESC
			LIMIT $2 OFFSET $3
		`, venueColumns), status, limit, offset)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil data venue"})
			return
		}
		h.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM venues WHERE status = $1`, status).Scan(&total)
	}
	defer rows.Close()

	for rows.Next() {
		var v model.Venue
		var facilities pq.StringArray
		var imageURLs pq.StringArray
		if err := rows.Scan(&v.ID, &v.Name, &v.Slug, &v.Address,
			&v.Latitude, &v.Longitude, &v.Description, &facilities, &imageURLs,
			&v.Status, &v.SportType, &v.RatingAvg, &v.ReviewCount,
			&v.CreatedAt, &v.UpdatedAt, &v.MinPrice); err != nil {
			continue
		}
		v.Facilities = []string(facilities)
		v.ImageURLs = []string(imageURLs)
		venues = append(venues, v)
	}

	if lat != 0 && lng != 0 {
		for i := range venues {
			dist := haversine(lat, lng, venues[i].Latitude, venues[i].Longitude)
			venues[i].Distance = &dist
		}
		// Don't cache location-based queries
		writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: venues, Total: total, Page: page, PerPage: limit})
		return
	}

	// Update cache (fetch full list for caching)
	go func() {
		cacheRows, err := h.db.Query(fmt.Sprintf(`
			SELECT %s FROM venues
			WHERE status = $1 AND ($2 = '' OR sport_type = $2)
			ORDER BY created_at DESC
		`, venueColumns), status, sport)
		if err != nil {
			return
		}
		defer cacheRows.Close()

		var allVenues []model.Venue
		for cacheRows.Next() {
			var v model.Venue
			var facilities pq.StringArray
			var imageURLs pq.StringArray
			if err := cacheRows.Scan(&v.ID, &v.Name, &v.Slug, &v.Address,
				&v.Latitude, &v.Longitude, &v.Description, &facilities, &imageURLs,
				&v.Status, &v.SportType, &v.RatingAvg, &v.ReviewCount,
				&v.CreatedAt, &v.UpdatedAt, &v.MinPrice); err != nil {
				continue
			}
			v.Facilities = []string(facilities)
			v.ImageURLs = []string(imageURLs)
			allVenues = append(allVenues, v)
		}
		venueCache.Store(cacheKey, &venueCacheEntry{
			data:      allVenues,
			total:     total,
			expiresAt: time.Now().Add(cacheTTL),
		})
	}()

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: venues, Total: total, Page: page, PerPage: limit})
}

func (h *VenueHandler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")
	var v model.Venue
	var facilities pq.StringArray
	var imageURLs pq.StringArray
	err := h.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT %s FROM venues WHERE id::text = $1 OR slug = $1
	`, venueColumns), id).Scan(
		&v.ID, &v.Name, &v.Slug, &v.Address,
		&v.Latitude, &v.Longitude, &v.Description, &facilities, &imageURLs,
		&v.Status, &v.SportType, &v.RatingAvg, &v.ReviewCount,
		&v.CreatedAt, &v.UpdatedAt, &v.MinPrice,
	)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "Venue tidak ditemukan"})
		return
	}
	v.Facilities = []string(facilities)
	v.ImageURLs = []string(imageURLs)
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: v})
}

type Slot struct {
	ID            string `json:"id"`
	CourtID       string `json:"court_id"`
	VenueID       string `json:"venue_id"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Status        string `json:"status"`
	CourtName     string `json:"court_name"`
	PricePerHour  int64  `json:"price_per_hour"`
	Price         int64  `json:"price"`
	Available     bool   `json:"available"`
}

func (h *VenueHandler) GetSlots(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	venueID := r.PathValue("id")
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	rows, err := h.db.QueryContext(ctx, `
		SELECT s.id, c.id, c.venue_id, s.date, s.start_time, s.end_time, s.status, c.name, c.price_per_hour,
			c.price_per_hour AS price,
			CASE WHEN s.status = 'available' THEN true ELSE false END
		FROM slots s
		JOIN courts c ON c.id = s.court_id
		WHERE c.venue_id = $1 AND s.date = $2
		ORDER BY c.name, s.start_time
	`, venueID, date)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil slot"})
		return
	}
	defer rows.Close()

	var slots []Slot
	for rows.Next() {
		var s Slot
		if err := rows.Scan(&s.ID, &s.CourtID, &s.VenueID, &s.Date, &s.StartTime, &s.EndTime, &s.Status, &s.CourtName, &s.PricePerHour, &s.Price, &s.Available); err != nil {
			continue
		}
		slots = append(slots, s)
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: slots})
}

func (h *VenueHandler) VenueReviews(w http.ResponseWriter, r *http.Request) {
	venueID := r.PathValue("id")
	rows, err := h.db.Query(`
		SELECT r.id, r.rating, r.comment, u.full_name, r.created_at
		FROM reviews r
		JOIN users u ON u.id = r.user_id
		WHERE r.venue_id = $1 AND r.is_visible = true
		ORDER BY r.created_at DESC LIMIT 20
	`, venueID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "Gagal mengambil review"})
		return
	}
	defer rows.Close()

	type reviewItem struct {
		ID       string    `json:"id"`
		Rating   float64   `json:"rating"`
		Comment  string    `json:"comment"`
		UserName string    `json:"user_name"`
		Initials string    `json:"initials"`
		Date     time.Time `json:"date"`
	}
	var reviews []reviewItem
	for rows.Next() {
		var ri reviewItem
		rows.Scan(&ri.ID, &ri.Rating, &ri.Comment, &ri.UserName, &ri.Date)
		parts := strings.Fields(ri.UserName)
		if len(parts) > 0 {
			ri.Initials = strings.ToUpper(string(parts[0][0]))
			if len(parts) > 1 {
				ri.Initials += strings.ToUpper(string(parts[len(parts)-1][0]))
			}
		}
		reviews = append(reviews, ri)
	}
	if reviews == nil {
		reviews = []reviewItem{}
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: reviews})
}

func (h *VenueHandler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Message: "OK"})
}

func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return c * 6371
}

func pgArray(arr []string) string {
	if len(arr) == 0 {
		return "{}"
	}
	escaped := make([]string, len(arr))
	for i, s := range arr {
		escaped[i] = `"` + strings.ReplaceAll(s, `"`, `\"`) + `"`
	}
	return "{" + strings.Join(escaped, ",") + "}"
}
