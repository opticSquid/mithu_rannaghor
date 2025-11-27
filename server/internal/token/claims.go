package token

import "github.com/golang-jwt/jwt/v5"

type AuthorizedUserJWTClaims struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}
