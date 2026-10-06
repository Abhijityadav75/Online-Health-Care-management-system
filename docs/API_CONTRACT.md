# MediCare Online Healthcare System — Frontend/Backend API Contract

## 1. Overview & Base Configuration

- **Base URL Configuration:** Configurable via Vite environment variable `VITE_API_BASE_URL`.
  - **Local Development Default:** `http://localhost:8080/medicare/api` (or relative `/api` when reverse proxying via Vite development server).
- **Protocol:** RESTful JSON over HTTP/HTTPS.
- **Client Implementation:** Native browser `fetch` wrapper (`src/api/apiClient.ts`).

---

## 2. Authentication & Session Architecture

1. **Session-Based Authentication:**
   - The Java backend uses Jakarta Servlet `HttpSession` management.
   - **Login (`POST /api/auth/login`):** On successful credential verification (email/phone + PBKDF2 password hash), the server creates an `HttpSession` and sets the session cookie (`MEDICARE_JSESSIONID` or `JSESSIONID`).
   - **Credentialed HTTP Requests:** All frontend requests initiated by `apiClient` include:
     ```ts
     credentials: "include"
     ```
   - **No JWT / Token Storage:** Session tokens and hashes are never stored in browser `localStorage` or transmitted via custom Authorization headers.
   - **Logout (`POST /api/auth/logout`):** Invalidates the `HttpSession` server-side and clears browser cookies.

2. **Access Control (RBAC):**
   - Intercepted by `com.medicare.filter.AuthFilter`.
   - Protected paths require an active `HttpSession` (returns `HTTP 401 Unauthorized` if unauthenticated).
   - Administrative paths require `Role.ADMIN` (returns `HTTP 403 Forbidden` if unauthorized).

---

## 3. Standard Response & Error Envelopes

All servlet responses conform to the uniform envelope defined in `com.medicare.util.ServletUtils`:

### Success Response Format (`HTTP 200 OK`, `HTTP 201 Created`)
```json
{
  "success": true,
  "message": "Optional human-readable confirmation message",
  "data": { ... }
}
```

### Error Response Format (`HTTP 400`, `HTTP 401`, `HTTP 403`, `HTTP 404`, `HTTP 409`, `HTTP 500`)
```json
{
  "success": false,
  "error": "Error Category or Title",
  "message": "Detailed sanitized error description",
  "data": null
}
```

---

## 4. Complete Endpoint Inventory

### 4.1. AuthServlet (`/api/auth/*`)

| Endpoint | Method | Auth Req. | Role | Request Body | Response Data | Status Codes |
| :--- | :---: | :---: | :---: | :--- | :--- | :---: |
| `/api/auth/login` | `POST` | No | Public | `{ identifier/email/phone, password }` | `{ user: SanitizedUser, role: string }` | 200, 400, 401, 403 |
| `/api/auth/logout` | `POST` | Yes | Any | None | `null` | 200 |
| `/api/auth/session` | `GET` | Yes | Any | None | `{ user: SanitizedUser, role: string }` | 200, 401 |
| `/api/auth/register` | `POST` | No | Public | `{ name, email, phone, password, role: 'PATIENT'\|'DOCTOR', specialization?, qualification? }` | `{ user: SanitizedUser, pendingApproval: boolean }` | 201, 400, 403, 409 |

---

### 4.2. AppointmentServlet (`/api/appointments/*`)

| Endpoint | Method | Auth Req. | Role | Path / Query Params | Request Body | Response Data | Status Codes |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| `/api/appointments` | `GET` | Yes | Any | None | None | `BackendAppointmentDto[]` (filtered by session role) | 200, 401 |
| `/api/appointments/patient` | `GET` | Yes | Patient / Admin | None | None | `BackendAppointmentDto[]` (patient appointments) | 200, 401 |
| `/api/appointments/doctor` | `GET` | Yes | Doctor / Admin | None | None | `BackendAppointmentDto[]` (doctor appointments) | 200, 401 |
| `/api/appointments/admin` | `GET` | Yes | Admin | None | None | `BackendAppointmentDto[]` (all system appointments) | 200, 401, 403 |
| `/api/appointments/{id}` | `GET` | Yes | Any Authorized | `id`: appointment ID | None | `BackendAppointmentDto` (ownership verified) | 200, 401, 403, 404 |
| `/api/appointments` | `POST` | Yes | Patient / Admin | None | `{ doctorId, appointmentDate, appointmentDateIso, appointmentTime, type?, reason, patientId? }` | `BackendAppointmentDto` | 201, 400, 401, 403, 409 |
| `/api/appointments/{id}/reschedule` | `PUT` | Yes | Patient / Admin | `id`: appointment ID | `{ date, dateIso?, time }` | `null` | 200, 400, 401, 403, 404 |
| `/api/appointments/{id}/status` | `PUT` | Yes | Doctor / Admin | `id`: appointment ID | `{ status: 'UPCOMING'\|'COMPLETED'\|'CANCELLED' }` | `null` | 200, 400, 401, 403, 404 |
| `/api/appointments/{id}` | `DELETE` | Yes | Any Authorized | `id`: appointment ID | None | `null` | 200, 401, 403, 404 |

---

### 4.3. UserServlet (`/api/users/*`)

| Endpoint | Method | Auth Req. | Role | Path Params | Request Body | Response Data | Status Codes |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| `/api/users` | `GET` | Yes | Admin | None | None | `SanitizedUserDto[]` | 200, 401, 403 |
| `/api/users/doctors` | `GET` | Yes | Any | None | None | `SanitizedUserDto[]` | 200, 401 |
| `/api/users/patients` | `GET` | Yes | Doctor / Admin | None | None | `SanitizedUserDto[]` | 200, 401, 403 |
| `/api/users/{id}` | `GET` | Yes | Self / Admin | `id`: user ID | None | `SanitizedUserDto` (Patient/Doctor restricted to self) | 200, 401, 403, 404 |
| `/api/users/{id}` | `PUT` | Yes | Self / Admin | `id`: user ID | `Partial<SanitizedUserDto>` (field whitelisted) | `SanitizedUserDto` | 200, 400, 401, 403, 404 |
| `/api/users/{id}` | `DELETE` | Yes | Admin | `id`: user ID | None | `null` | 200, 401, 403, 404 |
| `/api/users/doctors/{id}/approve` | `PUT` | Yes | Admin | `id`: doctor ID | None | `null` (idempotent, sends notification) | 200, 401, 403, 404 |
| `/api/users/doctors/{id}/reject` | `PUT` | Yes | Admin | `id`: doctor ID | None | `null` (idempotent, sends notification) | 200, 401, 403, 404 |

---

### 4.4. NotificationServlet (`/api/notifications/*`)

| Endpoint | Method | Auth Req. | Role | Path Params | Request Body | Response Data | Status Codes |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| `/api/notifications` | `GET` | Yes | Any | None | None | `BackendNotificationDto[]` (strictly for session user) | 200, 401 |
| `/api/notifications/{id}/read` | `PUT` | Yes | Any | `id`: notification ID | None | `null` (ownership verified via SQL) | 200, 401, 404 |
| `/api/notifications/read-all` | `PUT` | Yes | Any | None | None | `null` (marks all read for session user) | 200, 401 |

---

### 4.5. MedicalRecordServlet (`/api/medical-records/*`)

| Endpoint | Method | Auth Req. | Role | Query Params | Request Body | Response Data | Status Codes |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| `/api/medical-records` | `GET` | Yes | Any Authorized | `patientId?`: target patient | None | `BackendMedicalRecordDto[]` (requires COMPLETED relation) | 200, 400, 401, 403 |
| `/api/medical-records` | `POST` | Yes | Doctor / Admin | None | `{ patientId, recordDate?, recordType?, diagnosis, treatmentPlan?, prescriptions? }` | `BackendMedicalRecordDto` | 201, 400, 401, 403 |

---

### 4.6. FeedbackServlet (`/api/feedback/*`)

| Endpoint | Method | Auth Req. | Role | Query Params | Request Body | Response Data | Status Codes |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| `/api/feedback` | `GET` | Yes | Any | `doctorId?`, `patientId?` | None | `BackendFeedbackDto[]` (Admin calls `findAll()`) | 200, 401, 403 |
| `/api/feedback` | `POST` | Yes | Patient ONLY | None | `{ doctorId, appointmentId, rating (1-5), comment? }` | `BackendFeedbackDto` | 201, 400, 401, 403, 409 |

---

### 4.7. AnalyticsServlet (`/api/analytics/*`)

| Endpoint | Method | Auth Req. | Role | Path Params | Request Body | Response Data | Status Codes |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| `/api/analytics/overview` | `GET` | Yes | Admin | None | None | `AnalyticsOverviewDto` (dynamic SQL aggregations) | 200, 401, 403 |
