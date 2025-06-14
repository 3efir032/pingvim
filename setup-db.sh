#!/bin/bash

# Database configuration
DB_HOST="localhost"
DB_USER="your_db_user"
DB_PASSWORD="your_db_password"
DB_NAME="pycharm_notes"

# Check if MariaDB is installed
if ! command -v mysql &> /dev/null; then
    echo "MariaDB is not installed. Installing..."
    sudo apt update
    sudo apt install -y mariadb-server
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
    
    # Secure the installation
    echo "Securing MariaDB installation..."
    sudo mysql_secure_installation
fi

# Create database and user
echo "Creating database and user..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Import schema
echo "Importing database schema..."
sudo mysql $DB_NAME < db-schema.sql

echo "Database setup complete!"
echo "Make sure to update your .env file with the following:"
echo "DB_HOST=$DB_HOST"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "DB_NAME=$DB_NAME"
