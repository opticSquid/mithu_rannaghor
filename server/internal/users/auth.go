package users

import (
	"context"

	"mithur-rannaghor.com/backend/internal/token"
)

func CreateJwtToken(ctx context.Context, mobileNo string, repo Repository) (string, error) {
	user, err := repo.getUserByMobileNo(ctx, mobileNo)
	if err != nil {
		return "", err
	}
	token, err := token.GenerateToken(user.User_id, user.Role)
	if err != nil {
		return "", err
	}
	return token, nil
}
