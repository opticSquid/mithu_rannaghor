package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"mithur-rannaghor.com/backend/internal/db"
	"mithur-rannaghor.com/backend/internal/users"
	"mithur-rannaghor.com/backend/middlewares"
)

func main() {
	// Application entry point
	_ = godotenv.Load()
	ctx := context.Background()
	pool, err := db.NewPostgres(ctx)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to postgres")
	}
	defer pool.Close()

	userRepo := users.NewRepository(pool)
	usersHandler := users.NewHandler(userRepo)
	users.RegisterValidators()
	router := gin.Default()
	// * We do not use a proxy server so disable trusted proxies
	router.SetTrustedProxies(nil)
	// * donot put spaces after commas in the string of allowed origins env variable
	allowed_origins := strings.Split(os.Getenv("CORS_ALLOWED_ORIGINS"), ",")
	// configure CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowed_origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))
	router.Use(middlewares.DefaultHeaders())
	// create api route group for backend routes
	apiRouter := router.Group("/api")
	usersHandler.RegisterRoutes(apiRouter)

	log.Info().Msg("server running on :8080")
	srv := &http.Server{
		Addr:    ":8080",
		Handler: router.Handler(),
	}
	go func() {
		// service connections
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("listen error")
		}
	}()
	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal, 1)
	// kill (no params) by default sends syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall.SIGKILL but can't be caught, so don't need add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info().Msg("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("Server Shutdown Failed")
	}
	log.Info().Msg("Server exiting")
}
