package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

const (
	StandardMealPrice = 52.5
	SpecialMealPrice  = 120.0
	RicePricePerPlate = 10.0
	RotiPricePerPiece = 4.0
)

func getUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := dbPool.Query(context.Background(), `
		SELECT u.USER_ID, u.NAME, u.MOBILE_NO, u.BUILDING_NO, u.ROOM_NO, u.ROLE, u.PLAN, w.BALANCE 
		FROM USERS u 
		LEFT JOIN WALLET w ON u.USER_ID = w.USER_ID
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		err := rows.Scan(&u.UserID, &u.Name, &u.MobileNo, &u.BuildingNo, &u.RoomNo, &u.Role, &u.Plan, &u.Balance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}
	json.NewEncoder(w).Encode(users)
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var u User
	if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if u.Role == "" {
		u.Role = "normal"
	}

	tx, err := dbPool.Begin(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	err = tx.QueryRow(context.Background(), `
		INSERT INTO USERS (NAME, MOBILE_NO, BUILDING_NO, ROOM_NO, ROLE, PLAN) 
		VALUES ($1, $2, $3, $4, $5, $6) 
		RETURNING USER_ID
	`, u.Name, u.MobileNo, u.BuildingNo, u.RoomNo, u.Role, u.Plan).Scan(&u.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(context.Background(), `INSERT INTO WALLET (USER_ID, BALANCE) VALUES ($1, 0)`, u.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tx.Commit(context.Background())
	json.NewEncoder(w).Encode(u)
}

func rechargeWallet(w http.ResponseWriter, r *http.Request) {
	var req RechargeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tx, err := dbPool.Begin(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	var txnID int
	err = tx.QueryRow(context.Background(), `
		INSERT INTO WALLET_TRANSACTIONS (USER_ID, TXN_TYPE, STATUS, AMOUNT, REFERENCE_ID) 
		VALUES ($1, 'recharge', 'pending_acknowledgement', $2, $3) 
		RETURNING TXN_ID
	`, req.UserID, req.Amount, req.RefID).Scan(&txnID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Auto-confirm for this admin app as per user request (or we can keep it pending)
	// User said "some irregular customers pay when they order... roll over...".
	// Let's use the confirmed function directly for recharges in admin app.
	_, err = tx.Exec(context.Background(), `SELECT CONFIRM_WALLET_RECHARGE($1)`, txnID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tx.Commit(context.Background())
	w.WriteHeader(http.StatusOK)
}

func createDailyEntry(w http.ResponseWriter, r *http.Request) {
	var log EntryRequest
	if err := json.NewDecoder(r.Body).Decode(&log); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Calculate cost
	mealPrice := 0.0
	if log.HasMainMeal {
		mealPrice = StandardMealPrice
		if log.IsSpecial {
			mealPrice = SpecialMealPrice
		}
	}
	totalCost := mealPrice + (float64(log.ExtraRiceQty) * RicePricePerPlate) + (float64(log.ExtraRotiQty) * RotiPricePerPiece)

	tx, err := dbPool.Begin(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	// Insert Log
	_, err = tx.Exec(context.Background(), `
		INSERT INTO DAILY_LOGS (USER_ID, LOG_DATE, MEAL_TYPE, HAS_MAIN_MEAL, IS_SPECIAL, SPECIAL_DISH_NAME, EXTRA_RICE_QTY, EXTRA_ROTI_QTY, TOTAL_COST) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, log.UserID, log.LogDate, log.MealType, log.HasMainMeal, log.IsSpecial, log.SpecialDishName, log.ExtraRiceQty, log.ExtraRotiQty, totalCost)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update Wallet & Create Transaction
	var newBalance float64
	err = tx.QueryRow(context.Background(), `
		UPDATE WALLET SET BALANCE = BALANCE - $1 WHERE USER_ID = $2 RETURNING BALANCE
	`, totalCost, log.UserID).Scan(&newBalance)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(context.Background(), `
		INSERT INTO WALLET_TRANSACTIONS (USER_ID, TXN_TYPE, STATUS, AMOUNT, BALANCE_AFTER) 
		VALUES ($1, 'delivery', 'confirmed', $2, $3)
	`, log.UserID, totalCost, newBalance)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tx.Commit(context.Background())
	w.WriteHeader(http.StatusCreated)
}

type EntryRequest struct {
	UserID          int       `json:"user_id"`
	LogDate         time.Time `json:"log_date"`
	MealType        string    `json:"meal_type"`
	HasMainMeal     bool      `json:"has_main_meal"`
	IsSpecial       bool      `json:"is_special"`
	SpecialDishName string    `json:"special_dish_name"`
	ExtraRiceQty    int       `json:"extra_rice_qty"`
	ExtraRotiQty    int       `json:"extra_roti_qty"`
}

func getBill(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")

	userID, _ := strconv.Atoi(userIDStr)
	startDate, _ := time.Parse("2006-01-02", startDateStr)
	endDate, _ := time.Parse("2006-01-02", endDateStr)

	var report BillReport
	report.StartDate = startDate
	report.EndDate = endDate

	// Get User Info
	err := dbPool.QueryRow(context.Background(), `
		SELECT u.USER_ID, u.NAME, u.MOBILE_NO, u.BUILDING_NO, u.ROOM_NO, u.ROLE, u.PLAN, w.BALANCE 
		FROM USERS u 
		LEFT JOIN WALLET w ON u.USER_ID = w.USER_ID 
		WHERE u.USER_ID = $1
	`, userID).Scan(&report.User.UserID, &report.User.Name, &report.User.MobileNo, &report.User.BuildingNo, &report.User.RoomNo, &report.User.Role, &report.User.Plan, &report.User.Balance)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get Logs
	rows, err := dbPool.Query(context.Background(), `
		SELECT LOG_ID, LOG_DATE, MEAL_TYPE, HAS_MAIN_MEAL, IS_SPECIAL, SPECIAL_DISH_NAME, EXTRA_RICE_QTY, EXTRA_ROTI_QTY, TOTAL_COST 
		FROM DAILY_LOGS 
		WHERE USER_ID = $1 AND LOG_DATE BETWEEN $2 AND $3 
		ORDER BY LOG_DATE ASC, MEAL_TYPE DESC
	`, userID, startDate, endDate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var l DailyLog
		err := rows.Scan(&l.LogID, &l.LogDate, &l.MealType, &l.HasMainMeal, &l.IsSpecial, &l.SpecialDishName, &l.ExtraRiceQty, &l.ExtraRotiQty, &l.TotalCost)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		report.Logs = append(report.Logs, l)
		report.TotalSpent += l.TotalCost
	}

	// Closing balance is current balance
	report.ClosingBalance = report.User.Balance
	// Opening balance = ClosingBalance + TotalSpent - TotalRechargesInRange
	// For simplicity, let's just calculate it this way or return Current Balance as is.
	// Actually, Opening Balance should be balance at the start of the date range.
	// Let's just calculate Opening Balance as report.ClosingBalance + report.TotalSpent for now (assuming no recharges in between)
	// Proper way would be (Current Balance) - (Sum of TXNs after StartDate)
	var sumTXNAfter float64
	dbPool.QueryRow(context.Background(), `
		SELECT COALESCE(SUM(CASE WHEN TXN_TYPE = 'recharge' THEN AMOUNT ELSE -AMOUNT END), 0) 
		FROM WALLET_TRANSACTIONS 
		WHERE USER_ID = $1 AND CREATED_AT >= $2
	`, userID, startDate).Scan(&sumTXNAfter)

	report.OpeningBalance = report.ClosingBalance - sumTXNAfter

	json.NewEncoder(w).Encode(report)
}
