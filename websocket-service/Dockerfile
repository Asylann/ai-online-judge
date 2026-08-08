FROM golang:alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY pkg/ ./pkg/
COPY websocket-service/ ./websocket-service/
WORKDIR /build/websocket-service
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /websocket-service ./main.go

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /websocket-service .
EXPOSE 8082
ENTRYPOINT ["/app/websocket-service"]
