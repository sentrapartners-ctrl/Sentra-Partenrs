-- Migration: Add barkKey column to user_settings table
ALTER TABLE user_settings ADD COLUMN barkKey VARCHAR(255) NULL;
