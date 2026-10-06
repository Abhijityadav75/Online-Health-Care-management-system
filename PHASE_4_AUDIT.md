# Phase 4 System Integration Audit

## 1. Current Architecture
The MediCare application consists of a two-tier decoupled architecture:
- **Frontend**: React 19 SPA built with Vite, TypeScript, and Tailwind CSS.
  - **API Client**: `src/api/apiClient.ts` enforces `credentials: 'include'` for HttpOnly `JSESSIONID` cookie management.
  - **Typed API Layer**: `authApi.ts`, `userApi.ts`, `appointmentApi.ts`, `notificationApi.ts`, `medicalRecordApi.ts`, `feedbackApi.ts`, `analyticsApi.ts`.
  - **State Management**: `src/context/AppContext.tsx` provides centralized React state populated directly from backend servlet responses.
  - **Portals**: Patient (`/patient/*`), Doctor (`/doctor/*`), Admin (`/admin/*`).
- **Backend**: Java/Jakarta EE Servlet backend (`backend/src/main/java/com/medicare/`).
  - **Servlets**: `AuthServlet`, `UserServlet`, `AppointmentServlet`, `NotificationServlet`, `MedicalRecordServlet`, `FeedbackServlet`, `AnalyticsServlet`.
  - **Services & DAOs**: `AppointmentService`, `AsyncNotificationService`, `UserDAOImpl`, `AppointmentDAOImpl`, `MedicalRecordDAOImpl`, `NotificationDAOImpl`, `FeedbackDAOImpl`.
  - **Filters**: `AuthFilter` (Role-Based Access Control and session checks), `CORSFilter` (cross-origin header propagation).
  - **Connection Engine**: `DBConnection` using HikariCP/JDBC with configuration from `db.properties`.
- **Database**: MySQL relational database (`schema.sql` & `seed.sql`).
  - Tables: `users`, `appointments`, `medical_records`, `notifications`, `feedback`, `audit_logs`.

---

## 2. Backend Startup Requirements
- **Java Development Kit**: JDK 17 or higher (`java`, `javac`).
- **Build Tool**: Apache Maven 3.8+ (`mvn`).
- **Servlet Container**: Jakarta EE 10 / Servlet 6.0 compatible container (e.g. Apache Tomcat 10+ or Eclipse Jetty 12+).
- **Configuration**: `backend/src/main/resources/db.properties` with valid MySQL JDBC connection parameters.

---

## 3. Database Startup Requirements
- **Database Engine**: MySQL Server 8.0+.
- **Database Instance**: `medicare_db`.
- **Initialization**:
  1. `backend/src/main/resources/schema.sql` (Creates tables, foreign keys, indexes, and constraints).
  2. `backend/src/main/resources/seed.sql` (Populates initial system users and reference records).

---

## 4. Frontend Startup Requirements
- **Runtime Engine**: Node.js 18+ and npm.
- **Dependencies**: Installed via `npm install`.
- **Configuration**: `VITE_API_BASE_URL` (Defaults to `/api` for same-origin proxy setup).
- **Verification Commands**:
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run dev`

---

## 5. Existing Integration Tests
- **Java Unit & Integration Tests** (`backend/src/test/java/com/medicare/`):
  - `UserDAOTest.java`
  - `AppointmentDAOTest.java`
  - `TransactionHandlingTest.java`
  - `AuthServletTest.java`
  - `AppointmentServletTest.java`
  - `UserServletTest.java`
  - `NotificationServletTest.java`
  - `AnalyticsServletTest.java`
  - `CanonicalCrossRoleTest.java`
  - `SecurityHardeningTest.java`

---

## 6. Existing Mocked Tests
- **Frontend Mocked Contract Tests** (`src/api/__tests__/`):
  - `apiClient.test.ts`: Request serialization, headers, 204/403/500 envelope handling (4/4 PASS).
  - `authIntegration.test.ts`: Login, logout, session restoration contract handling (8/8 PASS).
  - `patientIntegration.test.ts`: Patient appointment booking, cancellation, rescheduling contracts (10/10 PASS).
  - `patientCallSiteTests.test.ts`: React call site invocation & ID propagation (10/10 PASS).
  - `doctorIntegration.test.ts`: Doctor appointment retrieval & status update contracts (13/13 PASS).
  - `adminIntegration.test.ts`: Admin user management, approvals, analytics contracts (16/16 PASS).
  - `sharedFeaturesIntegration.test.ts`: Notifications, medical records, feedback contracts (18/18 PASS).

---

## 7. Missing Real E2E Tests
- Live HTTP requests from browser / E2E test runner against a live running Jakarta Tomcat container backed by a live MySQL instance.

---

## 8. Potential Blockers
- **Sandbox Environment Constraints**:
  - `java`: Not installed in execution environment (`sh: 1: java: not found`).
  - `mvn`: Not installed in execution environment (`sh: 1: mvn: not found`).
  - `mysql`: Not installed in execution environment (`sh: 1: mysql: not found`).

---

## 9. Required Environment Variables & Configuration
- **Frontend**:
  - `VITE_API_BASE_URL`: Base API path (e.g. `http://localhost:8080/medicare-backend/api` or `/api`).
- **Backend (`db.properties`)**:
  - `db.url=jdbc:mysql://localhost:3306/medicare_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
  - `db.user=medicare_user`
  - `db.password=medicare_password`
  - `db.driver=com.mysql.cj.jdbc.Driver`

---

## 10. Exact Commands Required to Run the System
```bash
# 1. Database Setup
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS medicare_db;"
mysql -u root -p medicare_db < backend/src/main/resources/schema.sql
mysql -u root -p medicare_db < backend/src/main/resources/seed.sql

# 2. Backend Build & Test
cd backend
mvn clean test package

# 3. Frontend Build & Dev Server
npm install
npx tsc --noEmit
npm run build
npm run dev
```
