// Package service implements the auth business logic for the api-gateway.
// This layer orchestrates repository calls and encodes JWT tokens.
// It must NEVER import gin or touch HTTP concerns — those live in /handler.
package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/ai-online-judge/api-gateway/internal/repository"
	"github.com/ai-online-judge/pkg/models"
)

// AuthService defines the contract for authentication business logic.
type AuthService interface {
	Register(ctx context.Context, username, email, password string) (*models.User, string, error)
	Login(ctx context.Context, identifier, password string) (*models.User, string, error)
}

// jwtClaims extends the standard JWT registered claims with our user fields.
type jwtClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"` // "student" | "admin"
	jwt.RegisteredClaims
}

type authService struct {
	userRepo  repository.UserRepository
	jwtSecret []byte
}

// NewAuthService constructs an AuthService with its required dependencies.
// Called exclusively from main.go during dependency injection.
func NewAuthService(userRepo repository.UserRepository, jwtSecret string) AuthService {
	return &authService{
		userRepo:  userRepo,
		jwtSecret: []byte(jwtSecret),
	}
}

// Register creates a new student account and returns the user along with their signed JWT.
func (s *authService) Register(ctx context.Context, username, email, password string) (*models.User, string, error) {
	if len(password) < 8 {
		return nil, "", errors.New("password must be at least 8 characters")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", fmt.Errorf("auth_service.Register: bcrypt: %w", err)
	}

	user, err := s.userRepo.CreateUser(ctx, username, email, string(hash))
	if err != nil {
		return nil, "", fmt.Errorf("auth_service.Register: %w", err)
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, "", fmt.Errorf("auth_service.Register: sign token: %w", err)
	}
	return user, token, nil
}

// Login validates credentials against either email or username and returns user + token.
func (s *authService) Login(ctx context.Context, identifier, password string) (*models.User, string, error) {
	user, err := s.userRepo.GetUserByEmail(ctx, identifier)
	if err != nil {
		user, err = s.userRepo.GetUserByUsername(ctx, identifier)
		if err != nil {
			return nil, "", errors.New("invalid credentials")
		}
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, "", fmt.Errorf("auth_service.Login: sign token: %w", err)
	}
	return user, token, nil
}

func (s *authService) generateToken(user *models.User) (string, error) {
	claims := jwtClaims{
		UserID:   user.ID.String(),
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

