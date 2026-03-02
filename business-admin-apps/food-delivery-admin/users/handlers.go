package users

import (
	"encoding/json"
	"net/http"

	"github.com/soumalya/food-delivery-admin/database"
	"github.com/soumalya/food-delivery-admin/model"
)

func GetUsers(w http.ResponseWriter, r *http.Request) {
	dbPool := database.GetDbConn()
	rows, err := dbPool.Query(r.Context(), `
		SELECT u.USER_ID, u.NAME, u.MOBILE_NO, u.BUILDING_NO, u.ROOM_NO, u.ROLE, u.PLAN, w.BALANCE 
		FROM USERS u 
		LEFT JOIN WALLET w ON u.USER_ID = w.USER_ID
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		err := rows.Scan(&u.UserID, &u.Name, &u.MobileNo, &u.BuildingNo, &u.RoomNo, &u.Role, &u.Plan, &u.Balance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}
	json.NewEncoder(w).Encode(users)
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var u model.User
	if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if u.Role == "" {
		u.Role = "normal"
	}

	dbPool := database.GetDbConn()
	tx, err := dbPool.Begin(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())

	err = tx.QueryRow(r.Context(), `
		INSERT INTO USERS (NAME, MOBILE_NO, BUILDING_NO, ROOM_NO, ROLE, PLAN) 
		VALUES ($1, $2, $3, $4, $5, $6) 
		RETURNING USER_ID
	`, u.Name, u.MobileNo, u.BuildingNo, u.RoomNo, u.Role, u.Plan).Scan(&u.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(r.Context(), `INSERT INTO WALLET (USER_ID, BALANCE) VALUES ($1, 0)`, u.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tx.Commit(r.Context())
	json.NewEncoder(w).Encode(u)
}
