FROM golang:alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY pkg/ ./pkg/
COPY ast-service/ ./ast-service/
WORKDIR /build/ast-service
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /ast-service ./main.go

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /ast-service .
EXPOSE 8083
ENTRYPOINT ["/app/ast-service"]
