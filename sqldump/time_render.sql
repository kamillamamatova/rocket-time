CREATE DATABASE IF NOT EXISTS `time`;
USE `time`;

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(50) NOT NULL DEFAULT '',
  last_name VARCHAR(50) NOT NULL DEFAULT '',
  email VARCHAR(255) UNIQUE NULL,
  google_id VARCHAR(64) UNIQUE NULL,
  password VARCHAR(50) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS goals (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(200),
  target_hours INT,
  category ENUM('productive', 'learning', 'exercise', 'social', 'entertainment', 'hobbies') DEFAULT 'productive',
  deadline DATE,
  progress_hours FLOAT DEFAULT 0,
  status ENUM('not started', 'in progress', 'completed') DEFAULT 'not started',
  description TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS timelogs (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  goal_id INT NULL,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_hr FLOAT,
  category ENUM('productive', 'learning', 'exercise', 'social', 'entertainment', 'hobbies', 'time wasted') DEFAULT 'productive',
  title VARCHAR(200),
  description TEXT NULL,
  PRIMARY KEY (id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS oauth_credentials (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NULL,
  token_expiry DATETIME NULL,
  scope TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_oauth (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
