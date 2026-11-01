# EventPlan — Installation Guide

Precise, step-by-step setup for a **freshly cloned copy** of EventPlan on Windows (XAMPP).
Follow the steps in order. Each command block says **where** to run it.

> After cloning, the project folder looks like:
> ```
> eventplan/
> ├── backend/     ← Laravel API
> ├── frontend/    ← Angular app
> └── docs/        ← this documentation
> ```

---

## 0. Install the prerequisites (once per machine)

Install these and make sure each is on your system PATH:

| Tool | Version | Notes / download |
|------|---------|------------------|
| **XAMPP** | PHP 8.2+ | <https://www.apachefriends.org> — gives you MySQL and PHP |
| **Composer** | 2.x | <https://getcomposer.org> |
| **Node.js** | 18 LTS or newer | <https://nodejs.org> (includes npm) |
| **Angular CLI** | 19.x | install after Node: `npm install -g @angular/cli` |
| **Git** | any | to clone the repo |

Verify everything is installed (run in any terminal / PowerShell):
```powershell
php -v
composer -V
node -v
npm -v
ng version
```
If any command is "not recognized", install that tool or add it to PATH before continuing.

---

## 1. Get the code
```powershell
git clone <your-repo-url> eventplan
cd eventplan
```

---

## 2. Start MySQL and create the database

1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL** (it should turn green). *(Apache is NOT required.)*
3. Click **Admin** next to MySQL to open **phpMyAdmin** in the browser.
4. Click **New** (left sidebar), enter database name **`eventplan`**, choose collation
   **`utf8mb4_unicode_ci`**, and click **Create**.

> Prefer the command line? From `C:\xampp\mysql\bin` run:
> ```powershell
> .\mysql.exe -u root -e "CREATE DATABASE eventplan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
> ```

---

## 3. Set up the backend (Laravel API)

Run these **inside the `backend` folder**:
```powershell
cd backend

composer install                 # install PHP dependencies

Copy-Item .env.example .env       # create your environment file
php artisan key:generate          # generate APP_KEY
```

Open **`backend/.env`** and confirm the database block reads exactly:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eventplan
DB_USERNAME=root
DB_PASSWORD=
```
*(XAMPP's MySQL uses user `root` with an empty password by default.)*

Create all tables and load the demo data (vendors, services, sample event, logins):
```powershell
php artisan migrate:fresh --seed
```

Start the API server (leave this terminal open):
```powershell
php artisan serve
```
➡ The API now runs at **http://127.0.0.1:8000**.

---

## 4. Set up the frontend (Angular app)

Open a **second terminal** and run these **inside the `frontend` folder**:
```powershell
cd frontend

npm install                       # install JavaScript dependencies

npm start                         # start the dev server (ng serve)
```
➡ The app now runs at **http://localhost:4200**.

---

## 5. Open the app

Open **http://localhost:4200** in your browser and log in with one of the seeded accounts below.

---

## 6. Seeded login accounts

All seeded accounts use the password **`password`**.

| Role | Email | Use it to… |
|------|-------|------------|
| **Administrator** | `admin@eventplan.test` | manage users, verify vendors, set payment rules, view reports |
| **Client** | `client@eventplan.test` | create events, book services, record payments, track budget |
| **Vendor** | `vendor1@eventplan.test` | *Nairobi Caterers* — manage services, accept bookings, confirm payments |
| **Vendor** | `vendor2@eventplan.test` | *Bloom & Decor* |
| **Vendor** | `vendor3@eventplan.test` | *SnapShot Studios* |
| **Vendor** | `vendor4@eventplan.test` | *BeatMasters DJ* |

> **Important:** each vendor only sees bookings and payments for **their own** services.
> If you book a decor service, log in as **`vendor2@eventplan.test`** (Bloom & Decor) to act on it —
> not a different vendor.

---

## 7. Quick smoke test (verify it works)

1. Log in as **client** → **My Events** → open an event → it shows a budget bar and bookings.
2. Browse a service and **request a booking** for your event.
3. Log in as **the vendor that owns that service** → the **bell shows a red count**, and the
   request appears under **Bookings** → **Accept** it.
4. Back as the **client** → open the event → **Record payment** (enter an M-Pesa code as reference).
5. As the **vendor/admin** → **Bookings** → **Confirm** the payment → a receipt number is issued and
   the event budget updates.

---

## Resetting the data

To wipe everything and reload the demo data again (run in `backend/`):
```powershell
php artisan migrate:fresh --seed
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `SQLSTATE[HY000] [2002]` / "Can't connect to MySQL" | MySQL isn't running — start it in the XAMPP Control Panel. |
| `could not find driver (pdo_mysql)` | Enable `extension=pdo_mysql` in your `php.ini`, then restart the terminal. |
| `No application encryption key has been specified` | Run `php artisan key:generate` in `backend/`. |
| Port `8000` already in use | Run `php artisan serve --port=8001` and update `frontend/src/environments/environment.ts` → `apiUrl`. |
| Port `4200` already in use | Run `npm start -- --port 4300`. |
| Browser shows CORS / network error | Confirm the API is running on `http://127.0.0.1:8000` and matches `apiUrl` in `frontend/src/environments/environment.ts`. |
| `ng: command not found` | Run `npm install -g @angular/cli`. |
| Login says "Invalid email or password" | Re-seed: `php artisan migrate:fresh --seed`; use password `password`. |

---

## Using PostgreSQL instead of MySQL (optional)

The code is database-agnostic (Laravel schema builder, no raw SQL). To switch:
1. Set `DB_CONNECTION=pgsql` and the matching host/port/credentials in `backend/.env`.
2. Create a `eventplan` database in PostgreSQL.
3. Run `php artisan migrate:fresh --seed`.

No code changes are needed.
