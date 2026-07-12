# Multi-stage build: compile Go binary in builder, copy to minimal Alpine image.
# Final image is ~10MB — no Go toolchain bloat in production.

# ---- Stage 1: Builder ----
FROM golang:alpine AS builder

WORKDIR /build

# Copy go.mod/go.sum from monorepo root (build context is repo root)
COPY go.mod go.sum ./
RUN go mod download

# Copy shared packages and this service
COPY pkg/ ./pkg/
COPY api-gateway/ ./api-gateway/

WORKDIR /build/api-gateway
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /api-gateway ./main.go

# ---- Stage 2: Runtime ----
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /api-gateway .

EXPOSE 8080
ENTRYPOINT ["/app/api-gateway"]
