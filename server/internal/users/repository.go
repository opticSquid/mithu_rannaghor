package users

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// domain functions go here
func (r *Repository) createUser(ctx context.Context, user createUserRequest) (Users, error) {
	var createdUser Users
	query := `INSERT INTO users (NAME, MOBILE_NO) VALUES ($1, $2) RETURNING USER_ID, NAME, MOBILE_NO`
	err := r.db.QueryRow(ctx, query, user.Name, user.Mobile_No).Scan(&createdUser.User_id, &createdUser.Name, &createdUser.Mobile_No)
	if err != nil {
		return Users{}, err
	}
	return createdUser, nil
}

func (r *Repository) updateAddress(ctx context.Context, id int, user updateAddressRequest) (Users, error) {
	var updatedUser Users
	query := `UPDATE users SET BUILDING_NO=$1, ROOM_NO=$2 WHERE USER_ID=$3 RETURNING USER_ID, NAME, BUILDING_NO, ROOM_NO`
	err := r.db.QueryRow(ctx, query, user.Building_No, user.Room_No, id).Scan(&updatedUser.User_id, &updatedUser.Name, &updatedUser.Building_No, &updatedUser.Room_No)
	if err != nil {
		return Users{}, err
	}
	return updatedUser, nil
}

func (r *Repository) addSubscription(ctx context.Context, id int, user updatePlanRequest) (Users, error) {
	var updatedUser Users
	query := `UPDATE users SET PLAN=$1 WHERE USER_ID=$2 RETURNING USER_ID, NAME, PLAN`
	err := r.db.QueryRow(ctx, query, user.Plan, id).Scan(&updatedUser.User_id, &updatedUser.Name, &updatedUser.Plan)
	if err != nil {
		return Users{}, err
	}
	return updatedUser, nil
}

func (r *Repository) getUserByMobileNo(ctx context.Context, mobileNo string) (Users, error) {
	var user Users
	query := `SELECT USER_ID, NAME, MOBILE_NO, BUILDING_NO, ROOM_NO, ROLE, PLAN FROM users WHERE MOBILE_NO=$1`
	err := r.db.QueryRow(ctx, query, mobileNo).Scan(&user.User_id, &user.Name, &user.Mobile_No, &user.Building_No, &user.Room_No, &user.Role, &user.Plan)
	if err != nil {
		return Users{}, err
	}
	return user, nil
}
