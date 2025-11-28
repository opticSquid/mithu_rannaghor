package users

import (
	"context"
	"time"

	"mithur-rannaghor.com/backend/internal/token"
)

func CreateJwtToken(ctx context.Context, mobileNo string, repo Repository) (string, string, error) {
	user, err := repo.getUserByMobileNo(ctx, mobileNo)
	if err != nil {
		return "", "", err
	}
	access_token, err := token.GenerateToken(user.User_id, user.Role, 10*time.Minute)
	if err != nil {
		return "", "", err
	}
	refresh_token, err := token.GenerateToken(user.User_id, user.Role, 24*7*time.Hour)
	if err != nil {
		return "", "", err
	}
	return access_token, refresh_token, nil
}
