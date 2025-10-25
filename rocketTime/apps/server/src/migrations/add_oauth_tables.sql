-- Migration to add OAuth credentials table and update users table
-- Run this script to update your database schema

USE `time`;

-- Add new columns to users table for OAuth
ALTER TABLE users 
ADD COLUMN email VARCHAR(255) UNIQUE,
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create OAuth credentials table
CREATE TABLE oauth_credentials (
  id INT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry DATETIME NOT NULL,
  scope TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_oauth (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add description column to goals table
ALTER TABLE goals 
ADD COLUMN description TEXT;

-- Add description column to timelogs table  
ALTER TABLE timelogs 
ADD COLUMN description TEXT;

-- Update the category enum to include 'exercise' (fixing the typo)
ALTER TABLE goals MODIFY COLUMN category ENUM('productive', 'learning', 'exercise', 'social', 'entertainment');
ALTER TABLE timelogs MODIFY COLUMN category ENUM('productive', 'learning', 'exercise', 'social', 'entertainment', 'time wasted');
