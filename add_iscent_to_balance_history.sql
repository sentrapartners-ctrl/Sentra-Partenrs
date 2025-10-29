-- Add isCentAccount column to balance_history table
ALTER TABLE balance_history 
ADD COLUMN isCentAccount BOOLEAN NOT NULL DEFAULT FALSE;
