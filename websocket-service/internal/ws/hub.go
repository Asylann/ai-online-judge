package ws

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"

)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// CheckOrigin allows connections from any frontend origin during development
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Hub maintains active WebSocket connections indexed by user_id and routes messages
// received from Redis Pub/Sub directly to the appropriate student browser.
type Hub struct {
	// Active clients mapped by user_id -> map[*Client]bool (allows multiple open tabs)
	clients map[string]map[*Client]bool

	// Mutex ensuring thread-safe map access
	mu sync.RWMutex

	// Register requests from newly connected clients
	Register chan *Client

	// Unregister requests from disconnected clients
	Unregister chan *Client
}

// NewHub constructs an initialized Hub.
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

// Run executes the main registration/unregistration loop in a dedicated goroutine.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; !ok {
				h.clients[client.UserID] = make(map[*Client]bool)
			}
			h.clients[client.UserID][client] = true
			h.mu.Unlock()

			log.Printf("[websocket-service] Client registered: user_id=%s (active tabs: %d)",
				client.UserID, len(h.clients[client.UserID]))

		case client := <-h.Unregister:
			h.mu.Lock()
			if userClients, ok := h.clients[client.UserID]; ok {
				if _, exists := userClients[client]; exists {
					delete(userClients, client)
					close(client.Send)
					if len(userClients) == 0 {
						delete(h.clients, client.UserID)
					}

				}
			}
			h.mu.Unlock()
			log.Printf("[websocket-service] Client unregistered: user_id=%s", client.UserID)
		}
	}
}

// BroadcastToUser sends a raw JSON payload to all active WebSocket tabs for a given user_id.
func (h *Hub) BroadcastToUser(userID string, payload []byte) {
	h.mu.RLock()
	userClients, ok := h.clients[userID]
	if !ok || len(userClients) == 0 {
		h.mu.RUnlock()
		return
	}

	// Copy pointers so we can unlock before sending down channels
	clientsCopy := make([]*Client, 0, len(userClients))
	for client := range userClients {
		clientsCopy = append(clientsCopy, client)
	}
	h.mu.RUnlock()

	for _, client := range clientsCopy {
		select {
		case client.Send <- payload:
		default:
			// Buffer full or stalled — drop client to avoid blocking other connections
			h.Unregister <- client
		}
	}
}

// ListenToRedis subscribes to the Redis pattern "submissions.events.*" and routes
// arriving verdict or AI Tutor hint events to the specific connected student.
func (h *Hub) ListenToRedis(ctx context.Context, rdb *redis.Client) {
	pattern := "submissions.events.*"
	pubsub := rdb.PSubscribe(ctx, pattern)
	defer pubsub.Close()

	log.Printf("[websocket-service] Subscribed to Redis Pub/Sub pattern: %s", pattern)

	ch := pubsub.Channel()
	for msg := range ch {
		// Channel format: submissions.events.<user_id>
		userID := strings.TrimPrefix(msg.Channel, "submissions.events.")

		// Verify UserID from JSON payload fallback if needed
		var envelope struct {
			UserID       string `json:"user_id"`
			SubmissionID string `json:"submission_id"`
			Type         string `json:"type"`
		}
		if err := json.Unmarshal([]byte(msg.Payload), &envelope); err == nil && envelope.UserID != "" {
			userID = envelope.UserID
		}

		if userID != "" {
			h.BroadcastToUser(userID, []byte(msg.Payload))
		}
	}
}

// ServeWS handles WebSocket upgrade requests and registers the authenticated Client.
func ServeWS(hub *Hub, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.Query("token")
		userID, err := ParseToken(tokenString, jwtSecret)
		if err != nil {
			log.Printf("[websocket-service] Auth failed: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized WebSocket connection"})
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("[websocket-service] Upgrade failed: %v", err)
			return
		}

		client := &Client{
			Hub:    hub,
			Conn:   conn,
			UserID: userID,
			Send:   make(chan []byte, 256),
		}

		client.Hub.Register <- client

		go client.WritePump()
		go client.ReadPump()
	}
}
