CREATE TYPE TXN_TYPE AS ENUM('recharge', 'delivery', 'refund');

CREATE TYPE TXN_STATUS AS ENUM('pending_acknowledgement', 'confirmed', 'rejected');

CREATE TABLE WALLET_TRANSACTIONS (
	TXN_ID SERIAL PRIMARY KEY,
	-- Could have reffered WALLET (USER_ID) as well but if user gets deleted 
	-- wallet will be deleted too
	-- but we do not want transactions to be deleted for audit purposes
	USER_ID INT NOT NULL REFERENCES USERS (USER_ID),
	TXN_TYPE TXN_TYPE NOT NULL,
	STATUS TXN_STATUS NOT NULL DEFAULT 'pending_acknowledgement',
	AMOUNT NUMERIC(10, 2) NOT NULL,
	-- NULL until the txn is confirmed
	BALANCE_AFTER NUMERIC(10, 2),
	-- UPI reference / UTR number for recharges
	REFERENCE_ID TEXT,
	CREATED_AT TIMESTAMPTZ DEFAULT NOW(),
	UPDATED_AT TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION CONFIRM_WALLET_RECHARGE (P_TXN_ID INT) RETURNS VOID AS $$
DECLARE
    uid INT;
    amt NUMERIC(10,2);
    new_balance NUMERIC(10,2);
BEGIN
    -- Lock the transaction
    SELECT USER_ID, AMOUNT
    INTO uid, amt
    FROM WALLET_TRANSACTIONS
    WHERE TXN_ID = p_txn_id
      AND TXN_TYPE = 'recharge'
      AND STATUS = 'pending_acknowledgement'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 
            'Transaction % not found or not pending acknowledgement', p_txn_id;
    END IF;

    -- Update wallet
    UPDATE WALLET
    SET BALANCE = BALANCE + amt
    WHERE USER_ID = uid
    RETURNING BALANCE INTO new_balance;

    -- Finalize transaction
    UPDATE WALLET_TRANSACTIONS
    SET STATUS = 'confirmed',
        BALANCE_AFTER = new_balance,
        UPDATED_AT = NOW()
    WHERE TXN_ID = p_txn_id;
END;
$$ LANGUAGE PLPGSQL;

CREATE OR REPLACE FUNCTION REJECT_WALLET_RECHARGE (P_TXN_ID INT) RETURNS VOID AS $$
BEGIN
    UPDATE WALLET_TRANSACTIONS
    SET STATUS = 'rejected',
        UPDATED_AT = NOW()
    WHERE TXN_ID = p_txn_id
      AND STATUS = 'pending_acknowledgement';
END;
$$ LANGUAGE PLPGSQL;