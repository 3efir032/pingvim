-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS pycharm_notes;

-- Use the database
USE pycharm_notes;

-- Create pingvim table (renamed from folders)
CREATE TABLE IF NOT EXISTS pingvim (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_open TINYINT(1) DEFAULT 0,
  parent_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES pingvim(id) ON DELETE CASCADE
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content LONGTEXT,
  parent_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES pingvim(id) ON DELETE CASCADE
);

-- Insert default root folder if it doesn't exist
INSERT INTO pingvim (id, name, is_open, parent_id)
SELECT 1, 'Notes', 1, NULL
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM pingvim WHERE id = 1);
