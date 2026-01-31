package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var dbPool *pgxpool.Pool

func initDB() {
	host := os.Getenv("POSTGRES_HOST")
	if host == "" {
		host = "localhost" // fallback for local dev if not set
	}
	port := os.Getenv("POSTGRES_PORT")
	if port == "" {
		port = "5432" // fallback for local dev if not set
	}
	user := os.Getenv("POSTGRES_USER")
	if user == "" {
		user = "postgres" // fallback for local dev if not set
	}
	password := os.Getenv("POSTGRES_PASSWORD")
	if password == "" {
		password = "Password" // fallback for local dev if not set
	}
	dbName := os.Getenv("POSTGRES_DB")
	if dbName == "" {
		dbName = "postgres" // fallback for local dev if not set
	}
	sslMode := os.Getenv("POSTGRES_SSLMODE")
	if sslMode == "" {
		sslMode = "disable" // fallback for local dev if not set
	}
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", user, password, host, port, dbName, sslMode)

	var err error
	dbPool, err = pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}

	err = dbPool.Ping(context.Background())
	if err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	// Create tables if they don't exist
	_, err = dbPool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS EXPENSES (
            EXPENSE_ID SERIAL PRIMARY KEY,
            EXPENSE_DATE DATE NOT NULL,
            REASON TEXT NOT NULL,
            AMOUNT DECIMAL(10,2) NOT NULL,
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
	`)
	if err != nil {
		log.Fatalf("Unable to create tables: %v\n", err)
	}

	log.Println("Connected to database successfully")
}
