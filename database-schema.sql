-- Lost and Found Database Schema for MySQL
-- Run this script to create the necessary tables

CREATE DATABASE IF NOT EXISTS lost_found_db;
USE lost_found_db;

-- Table for storing lost and found items
CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('lost', 'found') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    date_reported TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    image_url VARCHAR(500),
    status ENUM('active', 'resolved') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_date_reported (date_reported)
);

-- Table for storing categories (optional - for dynamic categories)
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Phones, laptops, chargers, etc.'),
('Clothing', 'Jackets, hats, scarves, etc.'),
('Books', 'Textbooks, notebooks, etc.'),
('Keys', 'Room keys, car keys, etc.'),
('Jewelry', 'Rings, necklaces, watches, etc.'),
('Sports Equipment', 'Balls, rackets, gym equipment, etc.'),
('Bags/Backpacks', 'Backpacks, purses, luggage, etc.'),
('Documents', 'IDs, passports, certificates, etc.'),
('Other', 'Items that don\'t fit other categories');

-- Table for storing contact logs (optional - for tracking communications)
CREATE TABLE contact_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    contact_type ENUM('email', 'phone') NOT NULL,
    contacted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_item_id (item_id),
    INDEX idx_contacted_at (contacted_at)
);

-- Table for storing image uploads (if storing locally)
CREATE TABLE images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_item_id (item_id)
);

-- Create a view for active items with full details
CREATE VIEW active_items AS
SELECT 
    i.*,
    c.name as category_name,
    c.description as category_description
FROM items i
LEFT JOIN categories c ON i.category = c.name
WHERE i.status = 'active'
ORDER BY i.date_reported DESC;