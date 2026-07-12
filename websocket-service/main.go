// websocket-service: Real-time verdict and Virtual TA hint push via WebSockets.
// Adheres to our Adaptive Go Microservice Architecture: uses only config and ws (Client Hub).
package main

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ai-online-judge/pkg/database"
	"github.com/ai-online-judge/websocket-service/internal/config"
	"github.com/ai-online-judge/websocket-service/internal/ws"
)

func main() {
	// ── Step 1: Load Configuration ──────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[websocket-service] Config error: %v", err)
	}

	// ── Step 2: Establish External Connections ───────────────────────────────────
	ctx := context.Background()
	rdb, err := database.NewRedisClient()
	if err != nil {
		log.Fatalf("[websocket-service] Redis connection failed: %v", err)
	}
	defer rdb.Close()
	log.Println("[websocket-service] Redis connected")

	// ── Step 3: Initialize and Run Client Hub ───────────────────────────────────
	hub := ws.NewHub()
	go hub.Run()
	go hub.ListenToRedis(ctx, rdb)

	// ── Step 4: Configure HTTP/WebSocket Server ──────────────────────────────────
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "websocket-service",
		})
	})

	// GET /ws?token=<jwt> — upgraded via gorilla/websocket and registered with Hub
	r.GET("/ws", ws.ServeWS(hub, cfg.JWTSecret))

	// ── Step 5: Start Server ─────────────────────────────────────────────────────
	addr := ":" + cfg.Port
	log.Printf("[websocket-service] Starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("[websocket-service] Server failed: %v", err)
	}
}
