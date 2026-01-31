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
	password := os.Getenv("POSTGRES_PASSWORD")
	if password == "" {
		password = "Password" // fallback for local dev if not set
	}
	connStr := fmt.Sprintf("postgres://postgres:%s@localhost:5432/postgres?sslmode=disable", password)

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
