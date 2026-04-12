package journal

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/soumalya/food-delivery-admin/database"
	"github.com/soumalya/food-delivery-admin/meals"
	"github.com/soumalya/food-delivery-admin/model"
)

func CreateDailyEntry(w http.ResponseWriter, r *http.Request) {
	var log model.EntryRequest
	if err := json.NewDecoder(r.Body).Decode(&log); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// Get current meal prices
	prices := meals.GetMealPricesInternal(r.Context())

	// Calculate cost
	mealPrice := 0.0
	if log.HasMainMeal {
		mealPrice = prices["standard"]
		if log.IsSpecial {
			mealPrice = prices["special"]
		}
	}
	totalCost := mealPrice + (float64(log.ExtraRiceQty) * prices["rice"]) + (float64(log.ExtraRotiQty) * prices["roti"]) + (float64(log.ExtraChickenQty) * prices["chicken"]) + (float64(log.ExtraFishQty) * prices["fish"]) + (float64(log.ExtraEggQty) * prices["egg"]) + (float64(log.ExtraVegetableQty) * prices["vegetable"])

	dbPool := database.GetDbConn()
	tx, err := dbPool.Begin(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())

	// Insert Log
	_, err = tx.Exec(r.Context(), `
		INSERT INTO DAILY_LOGS (USER_ID, LOG_DATE, MEAL_TYPE, HAS_MAIN_MEAL, IS_SPECIAL, SPECIAL_DISH_NAME, EXTRA_RICE_QTY, EXTRA_ROTI_QTY, EXTRA_CHICKEN_QTY, EXTRA_FISH_QTY, EXTRA_EGG_QTY, EXTRA_VEGETABLE_QTY, TOTAL_COST) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9	, $10, $11, $12, $13)
	`, log.UserID, log.LogDate, log.MealType, log.HasMainMeal, log.IsSpecial, log.SpecialDishName, log.ExtraRiceQty, log.ExtraRotiQty, log.ExtraChickenQty, log.ExtraFishQty, log.ExtraEggQty, log.ExtraVegetableQty, totalCost)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch previous wallet balance
	// creating CREATED_AT value
	yyyy, MM, dd := log.LogDate.Date()
	utc_time := time.Now().UTC()
	crt_dt := strconv.Itoa(yyyy) + "-" + strconv.Itoa(int(MM)) + "-" + strconv.Itoa(dd) + " " + strconv.Itoa(utc_time.Hour()) + ":" + strconv.Itoa(utc_time.Minute()) + ":" + strconv.Itoa(utc_time.Second()) + "." + strconv.Itoa(utc_time.Nanosecond()) + "+" + "00"

	var prevBalanceAfter *float64
	err = tx.QueryRow(r.Context(), `SELECT BALANCE_AFTER FROM WALLET_TRANSACTIONS WHERE USER_ID = $1 AND CREATED_AT < $2 ORDER BY CREATED_AT DESC LIMIT 1`, log.UserID, crt_dt).Scan(&prevBalanceAfter)

	if err != nil && err.Error() != "no rows in result set" {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var currentBalance float64 = 0
	if prevBalanceAfter != nil {
		currentBalance = *prevBalanceAfter
	}
	newBalance := currentBalance - totalCost

	_, err = tx.Exec(r.Context(), `
		INSERT INTO WALLET_TRANSACTIONS (USER_ID, TXN_TYPE, STATUS, AMOUNT, BALANCE_AFTER, CREATED_AT) 
		VALUES ($1, 'delivery', 'confirmed', $2, $3, $4)
	`, log.UserID, totalCost, newBalance, crt_dt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tx.Commit(r.Context())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"new_balance": newBalance})
}

func DeleteDailyEntry(w http.ResponseWriter, r *http.Request) {
	logIDStr := chi.URLParam(r, "id")
	logID, _ := strconv.Atoi(logIDStr)

	dbPool := database.GetDbConn()
	tx, err := dbPool.Begin(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())

	// Get info to refund
	var userID int
	var totalCost float64
	var logDate time.Time
	err = tx.QueryRow(r.Context(), `SELECT USER_ID, TOTAL_COST, LOG_DATE FROM DAILY_LOGS WHERE LOG_ID = $1`, logID).Scan(&userID, &totalCost, &logDate)
	if err != nil {
		http.Error(w, "Entry not found", http.StatusNotFound)
		return
	}

	// Delete
	_, err = tx.Exec(r.Context(), `DELETE FROM DAILY_LOGS WHERE LOG_ID = $1`, logID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Log Wallet Transaction
	now := time.Now()
	createdAt := time.Date(logDate.Year(), logDate.Month(), logDate.Day(), now.Hour(), now.Minute(), now.Second(), now.Nanosecond(), logDate.Location())
	_, err = tx.Exec(r.Context(), `
		INSERT INTO WALLET_TRANSACTIONS (USER_ID, TXN_TYPE, STATUS, AMOUNT, BALANCE_AFTER, CREATED_AT) 
		VALUES ($1, 'refund', 'confirmed', $2, $3, $4)
	`, userID, totalCost, newBalance, createdAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tx.Commit(r.Context())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"new_balance": newBalance})
}

func UpdateDailyEntry(w http.ResponseWriter, r *http.Request) {
	logIDStr := chi.URLParam(r, "id")
	logID, _ := strconv.Atoi(logIDStr)

	var req model.EntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// Get current meal prices
	prices := meals.GetMealPricesInternal(r.Context())

	// Calculate new cost
	mealPrice := 0.0
	if req.HasMainMeal {
		mealPrice = prices["standard"]
		if req.IsSpecial {
			mealPrice = prices["special"]
		}
	}
	// Note: We only calculate basic extras as supported in the Edit feature
	newTotalCost := mealPrice + (float64(req.ExtraRiceQty) * prices["rice"]) + (float64(req.ExtraRotiQty) * prices["roti"]) + (float64(req.ExtraChickenQty) * prices["chicken"]) + (float64(req.ExtraFishQty) * prices["fish"]) + (float64(req.ExtraEggQty) * prices["egg"]) + (float64(req.ExtraVegetableQty) * prices["vegetable"])

	dbPool := database.GetDbConn()
	tx, err := dbPool.Begin(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())

	// Get old info
	var userID int
	var oldTotalCost float64
	err = tx.QueryRow(r.Context(), `SELECT USER_ID, TOTAL_COST FROM DAILY_LOGS WHERE LOG_ID = $1`, logID).Scan(&userID, &oldTotalCost)
	if err != nil {
		http.Error(w, "Entry not found", http.StatusNotFound)
		return
	}

	// Update Log
	_, err = tx.Exec(r.Context(), `
		UPDATE DAILY_LOGS 
		SET MEAL_TYPE = $1, HAS_MAIN_MEAL = $2, IS_SPECIAL = $3, SPECIAL_DISH_NAME = $4, EXTRA_RICE_QTY = $5, EXTRA_ROTI_QTY = $6, TOTAL_COST = $7
		WHERE LOG_ID = $8
	`, req.MealType, req.HasMainMeal, req.IsSpecial, req.SpecialDishName, req.ExtraRiceQty, req.ExtraRotiQty, newTotalCost, logID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Adjust Wallet
	costDiff := newTotalCost - oldTotalCost
	var newBalance float64
	if costDiff != 0 {
		// If diff is positive (cost increased), we subtract more from balance.
		// If diff is negative (cost decreased), we subtracting a negative number adds to balance.
		err = tx.QueryRow(r.Context(), `
			UPDATE WALLET SET BALANCE = BALANCE - $1 WHERE USER_ID = $2 RETURNING BALANCE
		`, costDiff, userID).Scan(&newBalance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Log Transaction
		txnType := "delivery"
		txnAmount := costDiff
		if costDiff < 0 {
			txnType = "refund"
			txnAmount = -costDiff
		}

		_, err = tx.Exec(r.Context(), `
			INSERT INTO WALLET_TRANSACTIONS (USER_ID, TXN_TYPE, STATUS, AMOUNT, BALANCE_AFTER) 
			VALUES ($1, $2, 'confirmed', $3, $4)
		`, userID, txnType, txnAmount, newBalance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// If cost didn't change, we still need to return the old balance (which didn't change)
	// We can query the balance or just use the oldBalance value, but oldBalance isn't fetched, oldTotalCost is.
	// Oh wait, if costDiff == 0, newBalance isn't calculated above!
	// Let's refactor this section safely string.
	var finalBalance float64
	if costDiff != 0 {
		finalBalance = newBalance
	} else {
		err = tx.QueryRow(r.Context(), `SELECT BALANCE FROM WALLET WHERE USER_ID = $1`, userID).Scan(&finalBalance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	tx.Commit(r.Context())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"new_balance": finalBalance})
}

func GetDailyEntries(w http.ResponseWriter, r *http.Request) {
	dateStr := r.URL.Query().Get("date")
	userIDStr := r.URL.Query().Get("user_id")

	if dateStr == "" {
		http.Error(w, "Date is required", http.StatusBadRequest)
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		http.Error(w, "Invalid date format", http.StatusBadRequest)
		return
	}

	query := `
		SELECT l.LOG_ID, l.USER_ID, u.NAME as USER_NAME, l.LOG_DATE, l.MEAL_TYPE, 
		       l.HAS_MAIN_MEAL, l.IS_SPECIAL, l.SPECIAL_DISH_NAME, 
		       l.EXTRA_RICE_QTY, l.EXTRA_ROTI_QTY, l.EXTRA_CHICKEN_QTY, l.EXTRA_FISH_QTY, l.EXTRA_EGG_QTY, l.EXTRA_VEGETABLE_QTY, l.TOTAL_COST 
		FROM DAILY_LOGS l
		JOIN USERS u ON l.USER_ID = u.USER_ID
		WHERE l.LOG_DATE = $1
	`
	args := []interface{}{date}

	if userIDStr != "" && userIDStr != "0" {
		userID, _ := strconv.Atoi(userIDStr)
		query += " AND l.USER_ID = $2"
		args = append(args, userID)
	}

	query += " ORDER BY u.NAME ASC, l.MEAL_TYPE DESC"

	dbPool := database.GetDbConn()
	rows, err := dbPool.Query(r.Context(), query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var logs []model.DailyLog
	for rows.Next() {
		var l model.DailyLog
		err := rows.Scan(&l.LogID, &l.UserID, &l.UserName, &l.LogDate, &l.MealType, &l.HasMainMeal, &l.IsSpecial, &l.SpecialDishName, &l.ExtraRiceQty, &l.ExtraRotiQty, &l.ExtraChickenQty, &l.ExtraFishQty, &l.ExtraEggQty, &l.ExtraVegetableQty, &l.TotalCost)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		logs = append(logs, l)
	}

	json.NewEncoder(w).Encode(logs)
}
