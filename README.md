# MediCare - Online Healthcare Management System

MediCare is a comprehensive, production-grade, and responsive **Web-Based Healthcare Management System**. It features a modern React Single Page Application (SPA) frontend running on Vite + TypeScript + Tailwind CSS, coupled with a robust Java Servlet backend that handles secure authentication, session caching, JDBC relational operations, and analytical processing.

The project is structured strictly according to clean software engineering principles, modular architecture, and industry-standard coding conventions.

---

## 🌟 Key Features

### 1. Patient Portal
* **Dynamic Appointment Booking**: Intuitive scheduling wizard with custom validations (blocks past dates, time clashes, holiday schedules).
* **Direct PDF Receipts**: One-click high-fidelity vector PDF receipt generation with `jsPDF` for confirmed slot allocations.
* **Personal Medical History**: Dedicated access to consultation records, diagnoses, and prescriptions logged by medical practitioners.
* **Profile Management**: Secure in-portal contact information and password update panels.

### 2. Doctor Dashboard
* **Schedules & Calendar View**: Interactive schedule organizer to monitor daily queues, checkups, and general consultation sessions.
* **Patient Records System**: Searchable database of associated patient records, enabling practitioners to append diagnoses and prescriptions in real-time.
* **Patient Feedback & Metrics**: Direct tracking of patient reviews, ratings, and active satisfaction ratios.

### 3. Admin Board (Master Control)
* **Secure User Management**: Full CRUD interface to add, edit, and safely delete system users (Doctors, Patients, Administrators).
* **Robust Confirmation Safeguards**: Modern, sandboxing-immune React HTML modals replacing blocking alert/confirm dialogs for flawless performance in iframe environments.
* **Appointment Overseer**: Master scheduling board to manage availability and handle system-wide bookings or reschedules.
* **Performance Analytics**: Visual data representations mapping consultation metrics, patient demographics, and system usage.
* **System Settings**: Global panel to tweak operational constraints.

---

## 📂 Project Structure

The repository is modularly split into a decoupled frontend (React SPA) and backend (Java Web Project):

```
medicare-healthcare-system/
├── backend/                             # Java Servlet Backend
│   ├── src/main/java/com/medicare/
│   │   ├── servlet/                     # HTTP Request Handlers (Auth, Appt, Users)
│   │   ├── model/                       # Data Domain Transfer Objects (DTOs)
│   │   ├── dao/                         # JDBC Database Access Layer (SQL Builders)
│   │   └── util/                        # Security Utilities (CORS, JSON Parser)
│   └── pom.xml                          # Maven Dependency Configuration
│
├── src/                                 # React Frontend (TypeScript)
│   ├── api/                             # API Client Layer (Axios Fetchers, Handlers)
│   ├── components/                      # Shared Presentational UI widgets (Sidebar, Headers)
│   ├── context/                         # Central State Engine (AppContext Auth, Sync)
│   ├── screens/                         # Multi-role Dashboards & Portal Screens
│   │   ├── admin/                       # Admin User/Appointment Manager
│   │   ├── doctor/                      # Doctor Calendar & Records Panel
│   │   └── patient/                     # Patient Booking Wizard & History
│   ├── utils/                           # DateTime & Input Sanitizers
│   ├── types.ts                         # System TypeScript Interfaces
│   └── main.tsx                         # Client Entry Point
│
├── index.html                           # SPA Main Document
├── package.json                         # Node Dependency Manager
├── vite.config.ts                       # Vite Compiler Settings
└── README.md                            # Comprehensive Developer Guide
```

---

## 🛠️ Tech Stack & Requirements

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, jsPDF.
* **Backend**: Java 17+, Jakarta Servlet API, Maven.
* **Database**: MySQL/MariaDB (configured via JDBC drivers), with offline-resilient LocalStorage backup caches in the frontend.

---

## ⚙️ Installation & Running Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [Java Development Kit (JDK)](https://www.oracle.com/java/technologies/downloads/) (v17 or higher)
* [Maven](https://maven.apache.org/) (for backend dependency resolution and build execution)

### 2. Frontend Setup (Vite SPA)
Navigate to the root directory and install dependencies:
```bash
npm install
```
To run the development server locally on `http://localhost:3000`:
```bash
npm run dev
```
To build and compile the frontend applet for static distribution:
```bash
npm run build
```

### 3. Backend Setup (Java Servlet API)
Navigate to the `backend` directory:
```bash
cd backend
```
Compile and package the servlet application:
```bash
mvn clean package
```
Deploy the resulting `.war` file to your servlet container of choice (e.g., Apache Tomcat, GlassFish) or run the embedded server configuration.

---

## 🛡️ Coding Standards & Quality Guidelines
* **Type-Safety**: Enforced strictly across all API payloads and visual states via defined TypeScript interfaces (`src/types.ts`).
* **Modular UI Components**: Screen layouts are split into independent components, utilizing atomic Tailwind utility classes for high-fidelity responsive behavior.
* **SQL Injection Immunity**: Backend endpoints use parameterized `PreparedStatement` SQL queries to ensure maximum database security.
* **Secure Fallbacks**: The frontend context integrates a localStorage resilience engine, ensuring the app remains perfectly functional, reviewable, and interactive even during network downtime.

---
*© 2026 MediCare Online Healthcare Network. Developed to the highest standards of Web-Based Software Solutions.*
