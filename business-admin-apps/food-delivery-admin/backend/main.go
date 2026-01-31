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
)

func main() {
	_ = godotenv.Load()
	initDB()
	defer dbPool.Close()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.AllowAll().Handler)

	r.Route("/api", func(r chi.Router) {
		r.Get("/users", getUsers)
		r.Post("/users", createUser)
		r.Post("/wallet/recharge", rechargeWallet)
		r.Get("/daily-entry", getDailyEntries)
		r.Post("/daily-entry", createDailyEntry)
		r.Put("/daily-entry/{id}", updateDailyEntry)
		r.Delete("/daily-entry/{id}", deleteDailyEntry)
		r.Get("/reports/bill", getBill)

		r.Get("/expenses", getExpenses)
		r.Post("/expenses", createExpense)
		r.Put("/expenses/{id}", updateExpense)
		r.Delete("/expenses/{id}", deleteExpense)
		r.Get("/dashboard/stats", getDashboardStats)
		r.Get("/analytics", getAnalyticsStats)
	})

	// Serve static files
	workDir, _ := os.Getwd()
	filesDir := filepath.Join(workDir, "..", "dist")
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
