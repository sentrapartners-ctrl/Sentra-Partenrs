-- Migration: Add barkKey column to users table
ALTER TABLE users ADD COLUMN barkKey VARCHAR(255) NULL;
