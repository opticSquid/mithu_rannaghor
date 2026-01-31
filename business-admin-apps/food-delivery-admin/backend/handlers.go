package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
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

	// Use provided date or default to now
	txnDate := req.TxnDate
	if txnDate.IsZero() {
		txnDate = time.Now()
	}

	var txnID int
	err = tx.QueryRow(context.Background(), `
		INSERT INTO WALLET_TRANSACTIONS (USER_ID, TXN_TYPE, STATUS, AMOUNT, REFERENCE_ID, CREATED_AT) 
		VALUES ($1, 'recharge', 'pending_acknowledgement', $2, $3, $4) 
		RETURNING TXN_ID
	`, req.UserID, req.Amount, req.RefID, txnDate).Scan(&txnID)
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

func deleteDailyEntry(w http.ResponseWriter, r *http.Request) {
	logIDStr := chi.URLParam(r, "id")
	logID, _ := strconv.Atoi(logIDStr)

	tx, err := dbPool.Begin(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	// Get info to refund
	var userID int
	var totalCost float64
	err = tx.QueryRow(context.Background(), `SELECT USER_ID, TOTAL_COST FROM DAILY_LOGS WHERE LOG_ID = $1`, logID).Scan(&userID, &totalCost)
	if err != nil {
		http.Error(w, "Entry not found", http.StatusNotFound)
		return
	}

	// Delete
	_, err = tx.Exec(context.Background(), `DELETE FROM DAILY_LOGS WHERE LOG_ID = $1`, logID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Refund Wallet
	var newBalance float64
	err = tx.QueryRow(context.Background(), `
		UPDATE WALLET SET BALANCE = BALANCE + $1 WHERE USER_ID = $2 RETURNING BALANCE
	`, totalCost, userID).Scan(&newBalance)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Log Transaction
	_, err = tx.Exec(context.Background(), `
		INSERT INTO WALLET_TRANSACTIONS (USER_ID, TXN_TYPE, STATUS, AMOUNT, BALANCE_AFTER) 
		VALUES ($1, 'refund', 'confirmed', $2, $3)
	`, userID, totalCost, newBalance)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tx.Commit(context.Background())
	w.WriteHeader(http.StatusOK)
}

func updateDailyEntry(w http.ResponseWriter, r *http.Request) {
	logIDStr := chi.URLParam(r, "id")
	logID, _ := strconv.Atoi(logIDStr)

	var req EntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Calculate new cost
	mealPrice := 0.0
	if req.HasMainMeal {
		mealPrice = StandardMealPrice
		if req.IsSpecial {
			mealPrice = SpecialMealPrice
		}
	}
	newTotalCost := mealPrice + (float64(req.ExtraRiceQty) * RicePricePerPlate) + (float64(req.ExtraRotiQty) * RotiPricePerPiece)

	tx, err := dbPool.Begin(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	// Get old info
	var userID int
	var oldTotalCost float64
	err = tx.QueryRow(context.Background(), `SELECT USER_ID, TOTAL_COST FROM DAILY_LOGS WHERE LOG_ID = $1`, logID).Scan(&userID, &oldTotalCost)
	if err != nil {
		http.Error(w, "Entry not found", http.StatusNotFound)
		return
	}

	// Update Log
	_, err = tx.Exec(context.Background(), `
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
	if costDiff != 0 {
		var newBalance float64
		// If diff is positive (cost increased), we subtract more from balance.
		// If diff is negative (cost decreased), we subtracting a negative number adds to balance.
		err = tx.QueryRow(context.Background(), `
			UPDATE WALLET SET BALANCE = BALANCE - $1 WHERE USER_ID = $2 RETURNING BALANCE
		`, costDiff, userID).Scan(&newBalance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Log Transaction
		txnType := "adjustment_charge"
		txnAmount := costDiff
		if costDiff < 0 {
			txnType = "adjustment_refund"
			txnAmount = -costDiff
		}

		_, err = tx.Exec(context.Background(), `
			INSERT INTO WALLET_TRANSACTIONS (USER_ID, TXN_TYPE, STATUS, AMOUNT, BALANCE_AFTER) 
			VALUES ($1, $2, 'confirmed', $3, $4)
		`, userID, txnType, txnAmount, newBalance)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	tx.Commit(context.Background())
	w.WriteHeader(http.StatusOK)
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

func getDailyEntries(w http.ResponseWriter, r *http.Request) {
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
		       l.EXTRA_RICE_QTY, l.EXTRA_ROTI_QTY, l.TOTAL_COST 
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

	rows, err := dbPool.Query(context.Background(), query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var logs []DailyLog
	for rows.Next() {
		var l DailyLog
		err := rows.Scan(&l.LogID, &l.UserID, &l.UserName, &l.LogDate, &l.MealType, &l.HasMainMeal, &l.IsSpecial, &l.SpecialDishName, &l.ExtraRiceQty, &l.ExtraRotiQty, &l.TotalCost)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		logs = append(logs, l)
	}

	json.NewEncoder(w).Encode(logs)
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

	// Calculate total recharges during billing period
	dbPool.QueryRow(context.Background(), `
		SELECT COALESCE(SUM(AMOUNT), 0)
		FROM WALLET_TRANSACTIONS
		WHERE USER_ID = $1
		  AND TXN_TYPE = 'recharge'
		  AND STATUS = 'confirmed'
		  AND CREATED_AT >= $2
		  AND CREATED_AT <= $3
	`, userID, startDate, endDate.AddDate(0, 0, 1)).Scan(&report.TotalRecharges)

	// Opening balance = Balance before the billing period started
	// Get the BALANCE_AFTER from the last confirmed transaction before the start date
	// If no transactions exist before start date, opening balance is 0
	var openingBalance *float64
	err = dbPool.QueryRow(context.Background(), `
		SELECT BALANCE_AFTER
		FROM WALLET_TRANSACTIONS
		WHERE USER_ID = $1
		  AND STATUS = 'confirmed'
		  AND CREATED_AT < $2
		ORDER BY CREATED_AT DESC, TXN_ID DESC
		LIMIT 1
	`, userID, startDate).Scan(&openingBalance)

	if err != nil || openingBalance == nil {
		// No transactions before start date, opening balance is 0
		report.OpeningBalance = 0
	} else {
		report.OpeningBalance = *openingBalance
	}

	json.NewEncoder(w).Encode(report)
}

func getExpenses(w http.ResponseWriter, r *http.Request) {
	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")

	query := `SELECT EXPENSE_ID, EXPENSE_DATE, REASON, AMOUNT, CREATED_AT FROM EXPENSES`
	var args []interface{}

	if startDateStr != "" && endDateStr != "" {
		startDate, _ := time.Parse("2006-01-02", startDateStr)
		endDate, _ := time.Parse("2006-01-02", endDateStr)
		query += ` WHERE EXPENSE_DATE BETWEEN $1 AND $2`
		args = append(args, startDate, endDate)
	}

	query += ` ORDER BY EXPENSE_DATE DESC, CREATED_AT DESC`

	rows, err := dbPool.Query(context.Background(), query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var expenses []Expense
	for rows.Next() {
		var e Expense
		err := rows.Scan(&e.ExpenseID, &e.ExpenseDate, &e.Reason, &e.Amount, &e.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		expenses = append(expenses, e)
	}

	json.NewEncoder(w).Encode(expenses)
}

func createExpense(w http.ResponseWriter, r *http.Request) {
	var e Expense
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := dbPool.QueryRow(context.Background(), `
		INSERT INTO EXPENSES (EXPENSE_DATE, REASON, AMOUNT) 
		VALUES ($1, $2, $3) 
		RETURNING EXPENSE_ID, CREATED_AT
	`, e.ExpenseDate, e.Reason, e.Amount).Scan(&e.ExpenseID, &e.CreatedAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(e)
}

func updateExpense(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var e Expense
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := dbPool.Exec(context.Background(), `
		UPDATE EXPENSES SET EXPENSE_DATE = $1, REASON = $2, AMOUNT = $3 
		WHERE EXPENSE_ID = $4
	`, e.ExpenseDate, e.Reason, e.Amount, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func deleteExpense(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	_, err := dbPool.Exec(context.Background(), `DELETE FROM EXPENSES WHERE EXPENSE_ID = $1`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func getDashboardStats(w http.ResponseWriter, r *http.Request) {
	var stats DashboardStats
	ctx := context.Background()

	// 1. Total & Monthly Revenue (from DAILY_LOGS)
	now := time.Now()
	firstOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	err := dbPool.QueryRow(ctx, `
		SELECT 
			COALESCE(SUM(TOTAL_COST), 0),
			COALESCE(SUM(CASE WHEN LOG_DATE >= $1 THEN TOTAL_COST ELSE 0 END), 0)
		FROM DAILY_LOGS
	`, firstOfMonth).Scan(&stats.TotalRevenue, &stats.MonthlyRevenue)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 2. Total & Monthly Expenses
	err = dbPool.QueryRow(ctx, `
		SELECT 
			COALESCE(SUM(AMOUNT), 0),
			COALESCE(SUM(CASE WHEN EXPENSE_DATE >= $1 THEN AMOUNT ELSE 0 END), 0)
		FROM EXPENSES
	`, firstOfMonth).Scan(&stats.TotalExpenses, &stats.MonthlyExpenses)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 3. Profit
	stats.NetProfit = stats.TotalRevenue - stats.TotalExpenses

	// 4. Active Customers Count
	err = dbPool.QueryRow(ctx, `SELECT COUNT(*) FROM USERS`).Scan(&stats.ActiveCustomers)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 5. Wallet Pool
	err = dbPool.QueryRow(ctx, `SELECT COALESCE(SUM(BALANCE), 0) FROM WALLET`).Scan(&stats.WalletPool)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(stats)
}

func getAnalyticsStats(w http.ResponseWriter, r *http.Request) {
	var stats AnalyticsStats
	ctx := context.Background()
	now := time.Now()
	startDate := now.AddDate(0, 0, -30)

	// 1. Revenue Trends (last 30 days)
	revenueRows, err := dbPool.Query(ctx, `
		SELECT LOG_DATE, SUM(TOTAL_COST) 
		FROM DAILY_LOGS 
		WHERE LOG_DATE >= $1 
		GROUP BY LOG_DATE 
		ORDER BY LOG_DATE ASC
	`, startDate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer revenueRows.Close()

	revenueMap := make(map[string]float64)
	for revenueRows.Next() {
		var date time.Time
		var amount float64
		revenueRows.Scan(&date, &amount)
		revenueMap[date.Format("2006-01-02")] = amount
		stats.TotalRevenue += amount
	}

	// 2. Expense Trends (last 30 days)
	expenseRows, err := dbPool.Query(ctx, `
		SELECT EXPENSE_DATE, SUM(AMOUNT) 
		FROM EXPENSES 
		WHERE EXPENSE_DATE >= $1 
		GROUP BY EXPENSE_DATE 
		ORDER BY EXPENSE_DATE ASC
	`, startDate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer expenseRows.Close()

	expenseMap := make(map[string]float64)
	for expenseRows.Next() {
		var date time.Time
		var amount float64
		expenseRows.Scan(&date, &amount)
		expenseMap[date.Format("2006-01-02")] = amount
		stats.TotalExpenses += amount
	}

	// Fill in Trends for each of the last 30 days
	for i := 0; i <= 30; i++ {
		d := startDate.AddDate(0, 0, i).Format("2006-01-02")
		stats.Trends = append(stats.Trends, TrendPoint{
			Date:     d,
			Revenue:  revenueMap[d],
			Expenses: expenseMap[d],
		})
	}

	// 3. Meal Type Distribution
	stats.MealTypes = make(map[string]int)
	var standardCount, specialCount int
	err = dbPool.QueryRow(ctx, `
		SELECT 
			COUNT(CASE WHEN IS_SPECIAL = false THEN 1 END),
			COUNT(CASE WHEN IS_SPECIAL = true THEN 1 END)
		FROM DAILY_LOGS
	`).Scan(&standardCount, &specialCount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	stats.MealTypes["Standard"] = standardCount
	stats.MealTypes["Special"] = specialCount

	// 4. Shift Distribution
	stats.Shifts = make(map[string]int)
	var lunchCount, dinnerCount int
	err = dbPool.QueryRow(ctx, `
		SELECT 
			COUNT(CASE WHEN MEAL_TYPE = 'lunch' THEN 1 END),
			COUNT(CASE WHEN MEAL_TYPE = 'dinner' THEN 1 END)
		FROM DAILY_LOGS
	`).Scan(&lunchCount, &dinnerCount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	stats.Shifts["Lunch"] = lunchCount
	stats.Shifts["Dinner"] = dinnerCount

	// 5. Profit Percentage
	if stats.TotalRevenue > 0 {
		stats.ProfitPercentage = ((stats.TotalRevenue - stats.TotalExpenses) / stats.TotalRevenue) * 100
	}

	json.NewEncoder(w).Encode(stats)
}
