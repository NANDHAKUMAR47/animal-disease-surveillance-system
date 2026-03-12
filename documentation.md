
# ZoonoGuard: Real-Time Zoonotic Disease Reporting & Monitoring System

## 1. Project Overview
**Abstract:** ZoonoGuard is a digital surveillance system designed to monitor zoonotic diseases (diseases that spread between animals and humans). It features a public-facing portal for awareness and an administrative dashboard for veterinary authorities to track outbreaks, manage livestock owners, and trigger automated alerts.

## 2. System Architecture
- **Frontend:** React 18, TypeScript, Tailwind CSS, Recharts (for Data Viz).
- **Backend:** Node.js (Simulated with dbService), RESTful API patterns.
- **Database:** MySQL (Schema provided below).
- **AI Integration:** Google Gemini API for medical/veterinary Q&A.
- **Alert System:** Logic-based triggering (Simulated SMS/WebSocket).

## 3. Database Schema (MySQL)

```sql
-- Create Database
CREATE DATABASE zoono_guard;
USE zoono_guard;

-- Table for Admin Users
CREATE TABLE admins (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Doctor', 'Official', 'Staff') DEFAULT 'Official'
);

-- Table for Animal Owners
CREATE TABLE owners (
    owner_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    area VARCHAR(100) NOT NULL,
    animal_type ENUM('Cattle', 'Poultry', 'Pigs', 'Sheep/Goat', 'Others'),
    animal_count INT DEFAULT 0,
    is_vaccinated BOOLEAN DEFAULT FALSE
);

-- Table for Outbreak Reports
CREATE TABLE outbreaks (
    outbreak_id INT PRIMARY KEY AUTO_INCREMENT,
    disease_name VARCHAR(100) NOT NULL,
    severity ENUM('Normal', 'Critical') DEFAULT 'Normal',
    area VARCHAR(100) NOT NULL,
    animal_type VARCHAR(50),
    cases_count INT DEFAULT 0,
    report_date DATE NOT NULL,
    status ENUM('Active', 'Contained', 'Monitored') DEFAULT 'Active'
);

-- Table for Public Queries
CREATE TABLE queries (
    query_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_name VARCHAR(100),
    sender_phone VARCHAR(20),
    category VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Modules
1. **Public Information Module:** Latest news, articles, and interactive disease stats.
2. **AI Veterinary Assistant:** Real-time guidance using LLM for symptom checks.
3. **Outbreak Management:** Admin tool for logging cases and severity.
4. **Owner Management:** Vaccination tracking and targeted alert dispatch.
5. **Real-time Analytics:** Visual representation of herd immunity and outbreak spread.

## 5. Future Scope
- **Geofencing:** Map-based visualization using Google Maps API.
- **Blockchain:** Secure recording of vaccination certificates.
- **Image Analysis:** AI-based symptom recognition from animal photos.
- **Multilingual Support:** Local language SMS for farmers.
