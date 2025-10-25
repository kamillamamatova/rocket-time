DROP DATABASE IF EXISTS `time`;
CREATE DATABASE `time`;
USE `time`;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(50) NOT NULL DEFAULT '',
  last_name VARCHAR(50) NOT NULL DEFAULT '',
  username VARCHAR(50) NOT NULL DEFAULT '',
  password VARCHAR(50) NOT NULL DEFAULT '',
  PRIMARY KEY (id)
)ENGINE=InnoDB;

INSERT INTO users (first_name, last_name, username, password)
VALUES
('Eileen', 'Tomy', 'etomy', 'hack'),
('Default', 'User', 'user', 'test');

CREATE TABLE goals (
	id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200),
    target_hours INT,
    category ENUM('productive', 'learning', 'excercise'),
    deadline DATE,
    progress_hours FLOAT DEFAULT 0,
    status ENUM('not started', 'in progress', 'completed') DEFAULT 'not started',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, user_id),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

)ENGINE=InnoDB;


INSERT INTO goals(user_id, title, target_hours, category, deadline)
VALUES
(1,'Learn ASL', 30, 'learning','2025-11-21'),
(1,'Do cardio', 7,'excercise',NULL),
(1,'Study calculus', 15, 'productive','2025-12-20');
UPDATE goals
SET 
  progress_hours = 10,
  status = 'in progress'
WHERE id = 1;

CREATE TABLE timelogs (
	id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    goal_id INT,
    date DATE,
	duration_hr FLOAT,
	category ENUM('productive', 'learning', 'excercise','social', 'hobbies', 'time wasted'),
   title VARCHAR(200),
    PRIMARY KEY (id, user_id),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE

)ENGINE=InnoDB;

INSERT INTO timelogs(user_id, goal_id, date, duration_hr,category, title)
VALUES
(1,1,'2025-9-20', 5.5, 'learning', 'Learning basic words for asl'),
(1,NULL,'2025-9-2', 1,'time wasted', 'Doom scrolling'),
(1,NULL,'2025-3-1', 1,'social', 'Hosting brunch'),
(1,NULL,'2025-4-20', 1,'hobbies', 'Knitting'),
(1,3,'2025-10-20', 2.1, 'productive', '');
