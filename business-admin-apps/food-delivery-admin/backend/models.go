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

type RechargeRequest struct {
	UserID int     `json:"user_id"`
	Amount float64 `json:"amount"`
	RefID  string  `json:"ref_id"`
}

type BillReport struct {
	User           User       `json:"user"`
	StartDate      time.Time  `json:"start_date"`
	EndDate        time.Time  `json:"end_date"`
	Logs           []DailyLog `json:"logs"`
	TotalSpent     float64    `json:"total_spent"`
	OpeningBalance float64    `json:"opening_balance"`
	ClosingBalance float64    `json:"closing_balance"`
}
