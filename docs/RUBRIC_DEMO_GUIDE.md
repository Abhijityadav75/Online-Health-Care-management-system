# MediCare — Evaluator Demonstration & Rubric Inspection Guide (Final Edition)

## 1. Project Overview
**MediCare** is a full-stack, enterprise-grade Web-Based Healthcare Management System designed for healthcare providers, medical practitioners, and patients. It streamlines clinical workflows including appointment scheduling, doctor schedule management, medical record generation, patient feedback collection, and administrative monitoring.

---

## 2. Problem Statement
Healthcare facilities often struggle with fragmented appointment scheduling, paper-based medical histories, and poor synchronization between patients and doctors. MediCare solves these challenges by providing:
- A centralized appointment booking platform with real-time slot conflict prevention.
- Role-based portals for Patients, Doctors, and Administrators.
- Secure, immutable clinical consultation record keeping.
- Automated multi-channel notification and audit log dispatching.

---

## 3. Solution Architecture
MediCare utilizes a decoupled, two-tier enterprise web architecture:

```
+-----------------------------------------------------------------------------------+
|                                 PRESENTATION LAYER                                |
|                        React 19 SPA (Vite + TypeScript + Tailwind)                 |
+-----------------------------------------------------------------------------------+
                                          |
                        HTTP REST API Requests (JSON)
                        credentials: "include" (JSESSIONID)
                                          v
+-----------------------------------------------------------------------------------+
|                                  CONTROLLER LAYER                                 |
|                       Jakarta Servlets (Auth, Appt, User, etc.)                   |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             SECURITY & INTERCEPTOR LAYER                          |
|                       AuthFilter (RBAC) + CORSFilter                              |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                               BUSINESS SERVICE LAYER                              |
|                       AppointmentService + AsyncNotificationService               |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                 DATA ACCESS LAYER                                 |
|                       DAOs (UserDAO, AppointmentDAO, etc.) + JDBC                 |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                  DATABASE LAYER                                   |
|                          MySQL 8.0 Relational Database                            |
+-----------------------------------------------------------------------------------+
```

---

## 4. Technology Stack
- **Frontend**: React 19, TypeScript 5, Vite 6, Tailwind CSS 4, Lucide Icons.
- **Backend**: Java 17, Jakarta Servlet 6.0 (Tomcat 10+), Gson JSON Processor.
- **Database**: MySQL 8.0 with JDBC (`DriverManager`).
- **Build Tools**: Apache Maven (Backend), Vite/npm (Frontend).

---

## 5. Core Java Concepts in Source Code
Evaluators can inspect the following source files to verify core Java requirements:

| Concept | Source File | Key Lines / Implementation |
| :--- | :--- | :--- |
| **Encapsulation & Beans** | `backend/src/main/java/com/medicare/model/User.java` | Private fields (`id`, `name`, `email`, `passwordHash`), public getters/setters, `equals()`, `hashCode()`, `toString()`. |
| **Inheritance** | `backend/src/main/java/com/medicare/model/Patient.java`<br>`backend/src/main/java/com/medicare/model/Doctor.java` | `public class Patient extends User` adds `emergencyContact`. `public class Doctor extends User` adds `specialization` and `qualification`. |
| **Interfaces & Polymorphism** | `backend/src/main/java/com/medicare/dao/UserDAO.java`<br>`backend/src/main/java/com/medicare/dao/UserDAOImpl.java` | Interface `UserDAO` defines abstract methods; `UserDAOImpl` provides concrete JDBC implementations. |
| **Java Collections** | `backend/src/main/java/com/medicare/dao/AppointmentDAOImpl.java` | Uses `List<Appointment>` for querying patient/doctor appointments. |
| **Custom Exceptions** | `backend/src/main/java/com/medicare/exception/` | `AppointmentException.java`, `DatabaseException.java`, `AuthenticationException.java`, `ValidationException.java`. |
| **Multithreading & Concurrency** | `backend/src/main/java/com/medicare/service/AsyncNotificationService.java` | Uses `Executors.newFixedThreadPool(4)` with custom `ThreadFactory` and `AtomicInteger` for non-blocking notification and audit trail dispatching. |

---

## 6. JDBC Implementation
- **Connection Management**: `backend/src/main/java/com/medicare/util/DBConnection.java` manages connections using `DriverManager.getConnection()` configured via `db.properties`.
- **Prepared Statements**: Universal usage across all DAOs prevents SQL injection.
- **CRUD Operations** (`UserDAOImpl.java`, `AppointmentDAOImpl.java`):
  - `CREATE`: `createUser()`, `createAppointment()`
  - `READ`: `findByEmail()`, `findByPatientId()`
  - `UPDATE`: `updateStatus()`, `approveDoctor()`
  - `DELETE`: `deleteUser()`

---

## 7. Database Schema
Defined in `backend/src/main/resources/schema.sql`:
1. `users`: Stores core accounts (Patient, Doctor, Admin) with role and approval status.
2. `appointments`: Stores scheduled consultations with foreign keys to `users(id)`.
3. `medical_records`: Stores clinical diagnoses and treatment plans.
4. `notifications`: Stores user in-app notifications.
5. `feedback`: Stores patient rating and comments for completed appointments.
6. `audit_logs`: Stores asynchronous system audit trails.

---

## 8. Transaction Handling
In `backend/src/main/java/com/medicare/service/AppointmentService.java` (`bookAppointmentWithTransaction`):
```java
Connection conn = DBConnection.getConnection();
conn.setAutoCommit(false); // Begin Transaction

// 1. Check doctor availability
// 2. Insert appointment record
// 3. Insert doctor notification record

conn.commit(); // Commit Transaction
```
If an exception occurs, `DBConnection.rollbackQuietly(conn)` is executed to maintain database consistency.

---

## 9. Servlet Implementation
In `backend/src/main/java/com/medicare/servlet/`:
- `AuthServlet.java`: Handles authentication endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/session`, `/api/auth/logout`).
- `AppointmentServlet.java`: Handles appointment operations (`/api/appointments/*`).
- `UserServlet.java`, `NotificationServlet.java`, `MedicalRecordServlet.java`, `FeedbackServlet.java`, `AnalyticsServlet.java`.

---

## 10. Session Management & RBAC
- Authenticated user principals are stored in the Jakarta `HttpSession`:
  ```java
  HttpSession session = req.getSession(true);
  session.setAttribute("user", authenticatedUser);
  ```
- JSESSIONID cookie is maintained automatically by the browser using `credentials: 'include'` in `src/api/apiClient.ts`.
- `AuthFilter.java` intercepts requests to protected routes and enforces role-based security rules.

---

## 11. Demo Credentials & Password Hashing
Demo accounts pre-seeded in `seed.sql` use standard password `password123` hashed via `PBKDF2WithHmacSHA256` (10,000 iterations, 256-bit key length, 16-byte salt):
- **Patient**: `abhi@example.com` / `password123`
- **Doctor**: `priya.gupta@medicare.com` / `password123`
- **Admin**: `admin@medicare.local` / `password123`
- Stored Hash: `dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=`

---

## 12. Demonstration Modes

Evaluators can review MediCare in two distinct modes:

### MODE A: FRONTEND-ONLY PREVIEW MODE
- Demonstrates UI layouts, responsive design, role navigation, and error boundaries.
- When live Java server is off, network requests cleanly display error notification banners without crashing or fabricating false persistent data.

### MODE B: FULL SYSTEM DEMO MODE (JAVA + MYSQL)
- Demonstrates real authentication, real JDBC database operations, real session cookies, and backend analytics.

#### Prerequisites for Mode B
1. **MySQL 8.0** running on `localhost:3306`.
2. **JDK 17+** and **Apache Maven 3.8+**.
3. **Node.js 18+** and **npm**.

```bash
# 1. Initialize Database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS medicare_db;"
mysql -u root -p medicare_db < backend/src/main/resources/schema.sql
mysql -u root -p medicare_db < backend/src/main/resources/seed.sql

# 2. Build & Deploy Java Backend
cd backend
mvn clean package
# Deploy target/medicare-backend.war to Tomcat 10 webapps/

# 3. Build & Run Frontend
npm install
npm run dev
```

---

## 13. Evaluator Source Code Checklist

| Feature | Key File to Inspect |
| :--- | :--- |
| **Inheritance & Encapsulation** | `backend/src/main/java/com/medicare/model/Patient.java` |
| **Interfaces & DAOs** | `backend/src/main/java/com/medicare/dao/UserDAO.java` |
| **Multithreading** | `backend/src/main/java/com/medicare/service/AsyncNotificationService.java` |
| **ACID Transactions** | `backend/src/main/java/com/medicare/service/AppointmentService.java` |
| **Servlets & Sessions** | `backend/src/main/java/com/medicare/servlet/AuthServlet.java` |
| **RBAC Security** | `backend/src/main/java/com/medicare/filter/AuthFilter.java` |
| **Database Schema** | `backend/src/main/resources/schema.sql` |
| **API Contract** | `docs/API_CONTRACT.md` |

---

## 14. 5-Minute Demonstration Sequence

### Step 1: Home & System Introduction *(Frontend-Only or Live)*
- Open application URL (`/`).
- Review public landing page, services overview, and doctor directory.

### Step 2: Patient Login **[LIVE BACKEND REQUIRED]**
- Click **Sign In** (`/signin`).
- Select **Patient** portal tab.
- Enter `abhi@example.com` / `password123`.
- Verify successful authentication and redirection to `/patient/dashboard`.

### Step 3: Inspect Seeded Appointment vs Book New Appointment **[LIVE BACKEND REQUIRED]**
- **Seeded Appointment Inspection**: Inspect `MC-20261001-98721` (**SEEDED DEMONSTRATION APPOINTMENT** with Dr. Priya Gupta).
- **New Booking Workflow**:
  - Click **Book Appointment**.
  - Select **Dr. Priya Gupta** (Cardiology).
  - Select an upcoming date and time slot.
  - Click **Confirm Booking**.
  - Verify returned server-generated appointment ID from `POST /api/appointments`.

### Step 4: Doctor Portal & Notifications **[LIVE BACKEND REQUIRED]**
- Logout patient, navigate to `/signin`.
- Select **Doctor** tab, log in as `priya.gupta@medicare.com` / `password123`.
- Open Notifications bell; inspect notification created by backend.
- Open Doctor Appointments tab.

### Step 5: Complete Consultation & Medical Record **[LIVE BACKEND REQUIRED]**
- Click **Complete Consultation** for the newly booked appointment.
- Enter diagnosis ("Essential Hypertension") and treatment details.
- Submit medical record to database (`POST /api/medical-records`).

### Step 6: Patient Review & Feedback **[LIVE BACKEND REQUIRED]**
- Log back in as `abhi@example.com`.
- Open **Medical History** to verify newly created medical record.
- Open **Notifications & Feedback**, submit a 5-star rating for the completed consultation.

### Step 7: Admin Portal & System Analytics **[LIVE BACKEND REQUIRED]**
- Log in as Admin (`admin@medicare.local` / `password123`).
- Open **Analytics** tab to view system-wide KPI summary calculated dynamically by `AnalyticsServlet`.
