package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/soumalya/food-delivery-admin/billing"
	"github.com/soumalya/food-delivery-admin/database"
	"github.com/soumalya/food-delivery-admin/expenses"
	"github.com/soumalya/food-delivery-admin/journal"
	"github.com/soumalya/food-delivery-admin/meals"
	"github.com/soumalya/food-delivery-admin/stats"
	"github.com/soumalya/food-delivery-admin/users"
	"github.com/soumalya/food-delivery-admin/wallet"
)

func main() {
	_ = godotenv.Load()
	dbPool := database.InitDB()
	defer dbPool.Close()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.AllowAll().Handler)

	r.Route("/api", func(r chi.Router) {
		r.Get("/users", users.GetUsers)
		r.Post("/users", users.CreateUser)
		r.Post("/wallet/recharge", wallet.RechargeWallet)
		r.Get("/daily-entry", journal.GetDailyEntries)
		r.Post("/daily-entry", journal.CreateDailyEntry)
		r.Put("/daily-entry/{id}", journal.UpdateDailyEntry)
		r.Delete("/daily-entry/{id}", journal.DeleteDailyEntry)
		r.Get("/reports/bill", billing.GetBill)
		r.Get("/expenses", expenses.GetExpenses)
		r.Post("/expenses", expenses.CreateExpense)
		r.Put("/expenses/{id}", expenses.UpdateExpense)
		r.Delete("/expenses/{id}", expenses.DeleteExpense)
		r.Get("/dashboard/stats", stats.GetDashboardStats)
		r.Get("/analytics", stats.GetAnalyticsStats)
		r.Post("/meals", meals.CreateMeal)
		r.Get("/meals", meals.GetMeals)
		r.Put("/meals/{id}", meals.UpdateMeal)
		r.Delete("/meals/{id}", meals.DeleteMeal)
	})

	// Serve static files
	workDir, _ := os.Getwd()
	filesDir := filepath.Join(workDir, ".", "dist")
	FileServer(r, "/", http.Dir(filesDir))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func FileServer(r chi.Router, path string, root http.FileSystem) {
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit any URL parameters.")
	}

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", http.StatusMovedPermanently).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))

		// If file doesn't exist, serve index.html for SPA
		fpath := filepath.Join(string(root.(http.Dir)), r.URL.Path)
		if _, err := os.Stat(fpath); os.IsNotExist(err) && !strings.HasPrefix(r.URL.Path, "/api") {
			http.ServeFile(w, r, filepath.Join(string(root.(http.Dir)), "index.html"))
			return
		}

		fs.ServeHTTP(w, r)
	})
}
