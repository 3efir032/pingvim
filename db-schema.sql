-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS pycharm_notes;

-- Use the database
USE pycharm_notes;

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_open TINYINT(1) DEFAULT 0,
  parent_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content LONGTEXT,
  parent_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Insert default root folder if it doesn't exist
INSERT INTO folders (id, name, is_open, parent_id)
SELECT 1, 'Notes', 1, NULL
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE id = 1);
