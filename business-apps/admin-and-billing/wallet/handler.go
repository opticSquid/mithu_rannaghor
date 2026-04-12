package wallet

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/soumalya/food-delivery-admin/database"
	"github.com/soumalya/food-delivery-admin/model"
)

func RechargeWallet(w http.ResponseWriter, r *http.Request) {
	var req model.RechargeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	dbPool := database.GetDbConn()
	tx, err := dbPool.Begin(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(r.Context())

	// Use provided date or default to now
	txnDate := req.TxnDate
	if txnDate.IsZero() {
		txnDate = time.Now()
	}

	var txnID int
	err = tx.QueryRow(r.Context(), `
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
	_, err = tx.Exec(r.Context(), `SELECT CONFIRM_WALLET_RECHARGE($1)`, txnID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tx.Commit(r.Context())
	w.WriteHeader(http.StatusOK)
}
