package main

import (
	"time"
)

type User struct {
	UserID     int     `json:"user_id"`
	Name       string  `json:"name"`
	MobileNo   string  `json:"mobile_no"`
	BuildingNo string  `json:"building_no"`
	RoomNo     string  `json:"room_no"`
	Role       string  `json:"role"`
	Plan       string  `json:"plan"`
	Balance    float64 `json:"balance"`
}

type DailyLog struct {
	LogID           int       `json:"log_id"`
	UserID          int       `json:"user_id"`
	UserName        string    `json:"user_name,omitempty"`
	LogDate         time.Time `json:"log_date"`
	MealType        string    `json:"meal_type"`
	HasMainMeal     bool      `json:"has_main_meal"`
	IsSpecial       bool      `json:"is_special"`
	SpecialDishName string    `json:"special_dish_name"`
	ExtraRiceQty    int       `json:"extra_rice_qty"`
	ExtraRotiQty    int       `json:"extra_roti_qty"`
	TotalCost       float64   `json:"total_cost"`
}

type Expense struct {
	ExpenseID   int       `json:"expense_id"`
	ExpenseDate time.Time `json:"expense_date"`
	Reason      string    `json:"reason"`
	Amount      float64   `json:"amount"`
	CreatedAt   time.Time `json:"created_at"`
}

type RechargeRequest struct {
	UserID  int       `json:"user_id"`
	Amount  float64   `json:"amount"`
	RefID   string    `json:"ref_id"`
	TxnDate time.Time `json:"txn_date"` // Will be stored in CREATED_AT
}

type BillReport struct {
	User           User       `json:"user"`
	StartDate      time.Time  `json:"start_date"`
	EndDate        time.Time  `json:"end_date"`
	Logs           []DailyLog `json:"logs"`
	TotalSpent     float64    `json:"total_spent"`
	TotalRecharges float64    `json:"total_recharges"`
	OpeningBalance float64    `json:"opening_balance"`
	ClosingBalance float64    `json:"closing_balance"`
}

type DashboardStats struct {
	TotalRevenue    float64 `json:"total_revenue"`
	TotalExpenses   float64 `json:"total_expenses"`
	NetProfit       float64 `json:"net_profit"`
	MonthlyRevenue  float64 `json:"monthly_revenue"`
	MonthlyExpenses float64 `json:"monthly_expenses"`
	ActiveCustomers int     `json:"active_customers"`
	WalletPool      float64 `json:"wallet_pool"`
}

type TrendPoint struct {
	Date     string  `json:"date"`
	Revenue  float64 `json:"revenue"`
	Expenses float64 `json:"expenses"`
}

type AnalyticsStats struct {
	Trends           []TrendPoint   `json:"trends"`
	MealTypes        map[string]int `json:"meal_types"`
	Shifts           map[string]int `json:"shifts"`
	TotalRevenue     float64        `json:"total_revenue"`
	TotalExpenses    float64        `json:"total_expenses"`
	ProfitPercentage float64        `json:"profit_percentage"`
}
