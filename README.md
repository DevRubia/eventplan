# EventPlan

**A Web-Based Event Planning and Service Booking Management System**

EventPlan connects clients with verified event service providers (caterers, decorators,
photographers, DJs, venues and more). Clients plan events, compare and book services, track
their budget, and record payments. Vendors manage services and bookings. Admins oversee users,
verify vendors, and configure the system.

Payments are made **outside the system** (M-Pesa, bank transfer, cash). EventPlan **records and
confirms** them — there is no payment gateway.

---

## 📖 Documentation

- **[docs/INSTALLATION.md](docs/INSTALLATION.md)** — precise, step-by-step setup for a cloned copy (+ seeded logins)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 19 (standalone components) |
| Backend | Laravel 12 REST API (PHP 8.2) |
| Auth | Laravel Sanctum (bearer tokens) |
| Database | MySQL / MariaDB (XAMPP) |

---

## Roles

- **Client** — create events, browse & book services, track budget, record payments
- **Vendor** — list services, accept/decline bookings, confirm payments received
- **Admin** — manage users, verify vendors, configure payment rules, view reports

---

## Prerequisites

- **XAMPP** (for Apache + MySQL) — or any MySQL/MariaDB server
- **PHP 8.2+** and **Composer**
- **Node.js 18+** and **npm**
- **Angular CLI**: `npm install -g @angular/cli`

---

## Setup

### 1. Database
Start MySQL (XAMPP Control Panel → Start **MySQL**), then create the database:

```sql
CREATE DATABASE eventplan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
(Use phpMyAdmin → **New**, or the MySQL console.)

### 2. Backend (Laravel API)
```bash
cd backend
composer install
cp .env.example .env        # if .env is missing
php artisan key:generate    # if APP_KEY is empty
```
Confirm the database section of `backend/.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eventplan
DB_USERNAME=root
DB_PASSWORD=
```
Build the schema and load demo data:
```bash
php artisan migrate:fresh --seed
php artisan serve           # API at http://127.0.0.1:8000
```

### 3. Frontend (Angular)
```bash
cd frontend
npm install
npm start                   # app at http://localhost:4200
```

Open **http://localhost:4200**.

---

## Demo logins

All seeded accounts use the password **`password`**.

| Role | Email |
|------|-------|
| Admin | `admin@eventplan.test` |
| Client | `client@eventplan.test` |
| Vendor | `vendor1@eventplan.test` (also vendor2–4) |

---

## How payments work (offline recording)

1. A booking is confirmed; the client sees the amount due (deposit defaults to **30%**).
2. The client pays **outside the system** (e.g. M-Pesa) and records the payment:
   amount, method, date and reference (e.g. the M-Pesa code). Status becomes **Pending**.
3. The **vendor or admin** verifies it against their real statement and clicks **Confirm**.
4. The booking balance and the event budget update automatically; a receipt number is issued.

Admins control the rules in **Payment Settings**: allowed methods, default deposit %, who may
confirm, whether a reference is required, currency, and the payment details shown to clients.

---

## Using a different database (e.g. PostgreSQL)

The code uses Laravel's schema builder, so it is portable. To switch, change
`DB_CONNECTION` in `.env` to `pgsql`, set the matching host/port/credentials, create the
database, and run `php artisan migrate:fresh --seed`. No code changes required.

---

## Project structure

```
eventplan/
├── backend/        Laravel 12 API
│   ├── app/Models/           Eloquent models
│   ├── app/Http/Controllers/Api/   API controllers
│   ├── app/Http/Middleware/EnsureRole.php   role-based access
│   ├── database/migrations/  schema
│   └── routes/api.php        all API endpoints
└── frontend/       Angular 19 SPA
    └── src/app/
        ├── core/   services, models, auth, interceptor, guards
        └── pages/  all screens (login, home, dashboard, events, bookings, admin…)
```
