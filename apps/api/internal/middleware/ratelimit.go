package middleware

import (
	"net/http"
	"sync"
	"time"
)

type visitor struct {
	count    int
	lastSeen time.Time
}

type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	rps      int
}

func NewRateLimiter(rps int) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rps:      rps,
	}
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) cleanup() {
	for {
		time.Sleep(1 * time.Minute)
		rl.mu.Lock()
		for ip, v := range rl.visitors {
			if time.Since(v.lastSeen) > 1*time.Minute {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
			ip = fwd
		}

		rl.mu.Lock()
		v, exists := rl.visitors[ip]
		if !exists {
			rl.visitors[ip] = &visitor{count: 1, lastSeen: time.Now()}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}
		if time.Since(v.lastSeen) > 1*time.Second {
			v.count = 1
			v.lastSeen = time.Now()
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}
		v.count++
		v.lastSeen = time.Now()
		if v.count > rl.rps {
			rl.mu.Unlock()
			writeJSON(w, http.StatusTooManyRequests, map[string]interface{}{
				"success": false,
				"error":   "Rate limit exceeded",
			})
			return
		}
		rl.mu.Unlock()
		next.ServeHTTP(w, r)
	})
}
