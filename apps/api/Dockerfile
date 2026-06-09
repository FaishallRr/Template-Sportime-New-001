# ── Build Stage ──
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY go.mod go.sum ./
RUN go mod tidy && go mod download

# Build the binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

# ── Production Stage ──
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Jakarta

WORKDIR /app
COPY --from=builder /server /app/server

EXPOSE 8080

CMD ["/app/server"]