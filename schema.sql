CREATE DATABASE IF NOT EXISTS labdb;
USE labdb;
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0
);
-- Usuario para la app (ejecutar como root/admin):
-- CREATE USER 'labuser'@'%' IDENTIFIED BY 'labpass';
-- GRANT ALL ON labdb.* TO 'labuser'@'%';
