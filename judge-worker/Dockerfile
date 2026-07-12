FROM golang:alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY pkg/ ./pkg/
COPY judge-worker/ ./judge-worker/
WORKDIR /build/judge-worker
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /judge-worker ./main.go

FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /judge-worker .
ENTRYPOINT ["/app/judge-worker"]
