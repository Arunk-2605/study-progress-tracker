# Study Progress Tracker

A full-stack, enterprise-grade study and curriculum management platform designed for self-directed learners and academic mentors. The application provides goal setting, structured topic progression with prerequisite dependency enforcement, study session time logging, and comprehensive supervisor monitoring and system configuration.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Angular 22 (Zoneless, Standalone Components)
- **Language:** TypeScript 5.x
- **Routing:** Angular Component & Functional Router with `authGuard` and `roleGuard`
- **HTTP Client:** Angular `provideHttpClient` with functional `authInterceptor`
- **Reactivity & State:** RxJS 7.x, Angular reactive state management with `ChangeDetectionStrategy.OnPush` and `ChangeDetectorRef`
- **Testing:** Vitest & Angular Testing Library

### Backend
- **Framework:** NestJS
- **Language:** TypeScript
- **ORM / Database Layer:** Prisma ORM
- **Database:** PostgreSQL (Port: `5433`, Database: `study_progress_tracker`)
- **Authentication:** JWT (JSON Web Tokens) with `bcrypt` password hashing
- **CORS:** Configured for `http://localhost:4200` with strict header validation (`Content-Type`, `Authorization`)

---

## 🌐 Endpoints, Ports & Demo Credentials

| Service | Local URL | Notes |
| :--- | :--- | :--- |
| **Frontend Application** | `http://localhost:4200` | Angular 22 Single Page App |
| **Backend REST API** | `http://localhost:3000` | NestJS Application |
| **PostgreSQL Database** | `localhost:5433` | Database: `study_progress_tracker` |

### Default Credentials
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Learner** | `learner@example.com` | `Password123!` | Goal creation, topic completion, session logging, prerequisite graph |
| **Mentor** | `mentor@example.com` | `Password123!` | System metrics, learner inspection (read-only), system config tuning |

---

## 🚀 Key Features

### 1. Authentication & Role-Based Access Control
- **JWT Storage:** Secure token persistence via `localStorage` with reactive decoding and state broadcast.
- **Functional Interceptor:** Automatically attaches `Authorization: Bearer <token>` to protected API endpoints, gracefully handles 401 Unauthorized responses with clean session clearing and redirection.
- **Guards:**
  - `authGuard`: Enforces authentication on all private dashboard, goal, and mentor views.
  - `roleGuard`: Enforces role segregation (`LEARNER` vs `MENTOR`) across views. Mentors cannot log study sessions or alter learner topics; learners cannot access mentor analytics or system configuration.
- **Login & Registration:**
  - Full client-side input validation, email formatting checks, minimum 8-character password length, confirm-password matching, and password visibility toggles (`👁️ / 👁️‍🗨️`).

### 2. Learner Dashboard (`/dashboard`)
- **Summary Metrics:**
  - Displays user profile name, total goals, total topics, completed topics, remaining topics, overall completion percentage, and cumulative study time formatted cleanly in hours and minutes (`Xh Ym`).
- **Goal Management:**
  - Real-time progress bars for each goal.
  - Interactive "New Goal" modal for creating goals with title and description.
  - Direct navigation to topic details and progress tracking.

### 3. Goal Details & Topic Dependency Engine (`/goals/:id`)
- **Prerequisite Enforcement (DAG):**
  - Displays topic unlock status (`LOCKED`, `UNLOCKED`, `COMPLETED`).
  - Topics with unfinished prerequisites are visually locked with a distinct lock badge and explicit missing prerequisite indicators.
  - Topic completion toggle dynamically calls `PATCH /goals/:goalId/topics/:topicId/status`.
  - **Cascading Reopen Protection:** Warns the user when reopening an earlier topic because downstream dependent topics will automatically be reopened by the backend dependency engine.
- **Prerequisite Linking Modal:**
  - Searchable prerequisite relationship manager enforcing strict acyclic validation (prevents circular dependencies).
- **Study Session Logging:**
  - Allows learners to record study sessions with topic selection, duration (minutes), date, and study notes.
  - Validates duration against mentor-configured bounds (`minSessionMinutes` to `maxSessionMinutes`).
  - Restricts session logging to unlocked or completed topics only (blocks logging against locked topics).
- **Session History:**
  - Chronological list of logged study sessions with timestamps, durations, and notes.

### 4. Mentor Supervisor Dashboard (`/mentor`)
- **System Analytics:**
  - Displays platform-wide statistics: total learners, aggregate learning goals, platform-wide topics, and cumulative student study hours.
- **Learner & Goal Directory:**
  - Search and filter goals by learner name, learner email, or goal title.
  - One-click navigation to inspect any learner's goal in **Supervisor Read-Only Mode**.
  - Mentor view hides interactive action buttons (session logging, status toggles, prerequisite editing) while providing full visibility into progress and topic states.

### 5. Mentor System Configuration (`/mentor/config`)
- **Configurable Platform Bounds:**
  - `minSessionMinutes`: Minimum allowable time for a logged study session (Default: 5).
  - `maxSessionMinutes`: Maximum allowable time for a single study session (Default: 480).
  - `maxPrerequisitesPerTopic`: Upper limit of prerequisite links allowed per topic (Default: 10).
- **Validation & Recovery:**
  - Form validation with error boundaries preventing invalid states (e.g., minimum exceeding maximum).
  - One-click "Restore Recommended Defaults" utility.
  - Live API integration with `GET /config` and `PATCH /config`.

---

## 💻 Project Structure

```text
study-progress-tracker/
├── backend/
│   └── study-tracker-api/       # NestJS backend application
│       ├── prisma/              # Prisma schema, migrations, seed script
│       └── src/                 # Controllers, services, DTOs, auth guards
├── frontend/
│   └── study-tracker-ui/        # Angular 22 zoneless standalone application
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/
│       │   │   │   ├── guards/          # authGuard, roleGuard
│       │   │   │   ├── interceptors/   # authInterceptor
│       │   │   │   └── models/         # api.models.ts (TypeScript interfaces)
│       │   │   ├── pages/
│       │   │   │   ├── login/          # Login component & styles
│       │   │   │   ├── register/       # Register component & styles
│       │   │   │   ├── dashboard/      # Learner dashboard
│       │   │   │   ├── goal-details/   # Goal topics, prereqs, sessions
│       │   │   │   ├── mentor-dashboard/# Supervisor metrics & goal search
│       │   │   │   └── mentor-config/  # Mentor configuration editor
│       │   │   ├── services/
│       │   │   │   ├── auth.ts         # Authentication & profile service
│       │   │   │   ├── goals.service.ts# Goals, topics, prereqs, sessions API
│       │   │   │   └── config.service.ts# Configuration API & cache
│       │   │   ├── app.routes.ts       # Application routing definition
│       │   │   ├── app.config.ts       # Application providers & HTTP setup
│       │   │   └── app.ts / app.html   # Root shell & navigation bar
│       │   └── styles.css              # Global design system & theme variables
└── README.md                    # Project documentation
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────┐
│         Browser (Angular 22 SPA)            │
│              http://localhost:4200           │
│  ┌─────────────────────────────────────┐    │
│  │  Standalone Components + RxJS       │    │
│  │  authGuard · roleGuard              │    │
│  │  authInterceptor (JWT Bearer)       │    │
│  └───────────────┬─────────────────────┘    │
└──────────────────┼──────────────────────────┘
                   │ HTTP/REST (JWT Bearer Token)
┌──────────────────▼──────────────────────────┐
│         NestJS REST API                     │
│              http://localhost:3000           │
│  ┌─────────────────────────────────────┐    │
│  │  Controllers · Services · Guards    │    │
│  │  JWT Strategy · bcrypt hashing      │    │
│  └───────────────┬─────────────────────┘    │
└──────────────────┼──────────────────────────┘
                   │ Prisma ORM
┌──────────────────▼──────────────────────────┐
│         PostgreSQL Database                 │
│              localhost:5433                  │
│         Database: study_progress_tracker    │
└─────────────────────────────────────────────┘
```

### Database Schema

| Table | Key Fields | Purpose |
| :--- | :--- | :--- |
| `User` | `id`, `name`, `email`, `password` (hashed), `role` (LEARNER / MENTOR) | User identity and authentication |
| `Goal` | `id`, `title`, `description`, `userId` | A learner's high-level learning track |
| `Topic` | `id`, `title`, `completed`, `goalId` | An individual step/topic within a goal |
| `TopicPrerequisite` | `topicId`, `prerequisiteId` | DAG edge — topic depends on prerequisite being completed first |
| `StudySession` | `id`, `date`, `minutes`, `note`, `userId`, `topicId` | A single logged block of study time |
| `AppConfig` | `id=1`, `minSessionMinutes`, `maxSessionMinutes`, `maxPrerequisites` | Global platform configuration (singleton row) |

### API Endpoints

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | None | Any | Register a new user account |
| `POST` | `/auth/login` | None | Any | Login and receive a JWT access token |
| `GET` | `/auth/profile` | JWT | Any | Retrieve own user profile |
| `GET` | `/auth/mentor-dashboard` | JWT | MENTOR | Platform-wide mentor analytics |
| `POST` | `/goals` | JWT | LEARNER | Create a new learning goal |
| `GET` | `/goals` | JWT | Any | List all goals (learner: own goals; mentor: all) |
| `POST` | `/goals/:id/topics` | JWT | LEARNER | Add a topic to a goal |
| `GET` | `/goals/:id/topics` | JWT | Any | List topics with prerequisite and lock status |
| `POST` | `/goals/:id/topics/:tid/prerequisites` | JWT | LEARNER | Link a prerequisite to a topic |
| `PATCH` | `/goals/:id/topics/:tid/status` | JWT | LEARNER | Toggle topic completion (triggers cascade reopen) |
| `POST` | `/goals/:id/sessions` | JWT | LEARNER | Log a study session |
| `GET` | `/goals/:id/sessions` | JWT | Any | Retrieve session history for a goal |
| `GET` | `/goals/:id/progress` | JWT | Any | Get goal completion progress and statistics |
| `GET` | `/config` | JWT | MENTOR | View current platform configuration |
| `PATCH` | `/config` | JWT | MENTOR | Update platform configuration bounds |

---

## ⚙️ Installation & Running Locally

> **Windows Note:** All commands below can be run in **PowerShell** or **Command Prompt**. Use `cd` to navigate between directories. File paths use backslashes on Windows but forward slashes work in most shells.

### Prerequisites

| Requirement | Version | Notes |
| :--- | :--- | :--- |
| **Git** | Any recent | [Download](https://git-scm.com/downloads/win) — for cloning the repository |
| **Node.js** | v18 or v20+ | [Download](https://nodejs.org/) — npm is bundled |
| **npm** | v9 or v10+ | Bundled with Node.js |
| **PostgreSQL** | 14+ | [Download](https://www.postgresql.org/download/windows/) — **configure to run on port `5433`** (non-standard) |

### 1. Clone the Repository
```bash
git clone <repository-url>
cd study-progress-tracker
```

### 2. Create the PostgreSQL Database

Open **pgAdmin** or the **psql** command-line tool and run:

```sql
CREATE DATABASE study_progress_tracker;
```

Then create (or verify) the backend environment file at:

```
backend/study-tracker-api/.env
```

Paste the following content, replacing `<username>` and `<password>` with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5433/study_progress_tracker?schema=public"
JWT_SECRET="replace_this_with_a_long_random_secret_string"
```

> **Example** (default PostgreSQL superuser):
> ```env
> DATABASE_URL="postgresql://postgres:yourpassword@localhost:5433/study_progress_tracker?schema=public"
> JWT_SECRET="my-super-secret-jwt-key-change-in-production"
> ```

### 3. Backend Setup — Migrations & Seed
```bash
cd backend/study-tracker-api
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
```

| Command | Purpose |
| :--- | :--- |
| `npx prisma generate` | Generates the Prisma TypeScript client from `schema.prisma` |
| `npx prisma migrate deploy` | Applies all pending database schema migrations |
| `npm run seed` | Populates the database with 2 demo users, 3 goals, 12 topics, prerequisite chains, and 30 study sessions |

> [!CAUTION]
> **Do not run `npm run seed` more than once.** The seed script uses `create` (not `upsert`) for goals, topics, and sessions — re-running it will duplicate data. Only users are upserted safely.

### 4. Start the Backend
```bash
cd backend/study-tracker-api
npm run start:dev
```
*The backend API will run on `http://localhost:3000`.*

### 5. Frontend Setup & Start
```bash
cd frontend/study-tracker-ui
npm install
npx ng serve
```
*The frontend application will run on `http://localhost:4200`.*

---

## 🧪 Testing & Build Verification

### Run Unit Test Suite
To run all Angular unit tests with Vitest:
```bash
cd frontend/study-tracker-ui
npx ng test --watch=false
```
*Output: All 7 test suites (25 unit tests) pass with 0 errors.*

### Run Automated End-to-End Tests (Playwright)

> [!IMPORTANT]
> E2E tests require **both the backend and frontend to be running** before executing. Start the NestJS backend (`npm run start:dev` in `backend/study-tracker-api`) and the Angular dev server (`npx ng serve` in `frontend/study-tracker-ui`) first.

To execute the automated Playwright E2E tests against the real running backend and frontend:
```bash
cd frontend/study-tracker-ui
npm run test:e2e
```
*Output: All 10 end-to-end integration tests pass on Chromium.*

To view the generated interactive HTML Playwright report:
```bash
cd frontend/study-tracker-ui
npm run test:e2e:report
```

### Run Production Build
To verify the Angular production build bundle:
```bash
cd frontend/study-tracker-ui
npx ng build --configuration=production
```
*Output: Clean bundle generation with 0 compilation errors.*

---

## 📋 Comprehensive Verification Guide

### Scenario A: Learner Workflow & Prerequisites
1. Open `http://localhost:4200/login`.
2. Enter email `learner@example.com` and password `Password123!`.
3. View the **Learner Dashboard**:
   - Check overall statistics: Total Goals, Topics, Completed/Remaining, Progress Percentage, and Total Study Hours/Minutes.
   - Click **"+ Create New Goal"** to add a goal (e.g., "Full-Stack System Design").
4. Click on any goal card to open **Goal Details**:
   - Observe the topics list.
   - Notice topic states: Unlocked vs Locked (missing prerequisites are listed explicitly).
   - Try toggling a topic: Completing a prerequisite will immediately unlock dependent topics.
   - If reopening a completed topic with downstream dependents, acknowledge the cascade prompt.
5. Click **"Log Study Session"**:
   - Select an unlocked topic, enter minutes (between 5 and 480), select a date, and add notes.
   - Click **"Save Session"** and verify the total study time updates immediately.
6. Click **"Manage Prerequisites"**:
   - Configure dependencies between topics.

### Scenario B: Mentor Workflow & Inspection
1. Log out or navigate to `http://localhost:4200/login`.
2. Enter email `mentor@example.com` and password `Password123!`.
3. Automatically redirected to `/mentor`:
   - View system-wide metrics (Learners, Goals, Topics, Total Study Time).
   - Use the search bar to filter goals by learner name or goal title.
   - Click **"Inspect Goal"** on any learner's goal:
     - Notice the blue banner: *"Supervisor Read-Only Mode: Viewing learner's progress. Interactive actions are disabled."*
     - All session logging and status toggle controls are hidden.
4. Click **"Configuration"** in the top navigation:
   - Adjust `minSessionMinutes`, `maxSessionMinutes`, or `maxPrerequisitesPerTopic`.
   - Click **"Save Settings"** to persist configuration changes to the backend.
   - Click **"Reset to Defaults"** if you wish to restore standard limits.


---

## ⚠️ Known Limitations

| # | Limitation | Detail |
| :--- | :--- | :--- |
| 1 | **Single shared learner account** | The seed script creates one demo learner account. In production each learner would have their own isolated goal space. |
| 2 | **No password reset** | There is no "Forgot password" or email-based recovery flow. |
| 3 | **No topic deletion** | Once a topic is created it cannot be deleted through the UI (no `DELETE /topics/:id` endpoint). |
| 4 | **No goal deletion** | Goals cannot be deleted through the frontend or backend API. |
| 5 | **Seed script is not idempotent for goals/sessions** | Running `npm run seed` more than once will duplicate goals, topics, and sessions. Only the two demo users are upserted safely. |
| 6 | **Non-standard PostgreSQL port** | The database runs on port `5433` instead of the default `5432`. Ensure your PostgreSQL installation is configured accordingly (set during install or via `postgresql.conf`). |
| 7 | **Development mode only** | `npx ng serve` runs the Angular app in development mode. For a production deployment, build with `npx ng build --configuration=production` and serve the `dist/` output with a static file server (e.g., `nginx`, `serve`). |
| 8 | **JWT stored in localStorage** | Tokens are persisted in `localStorage` for convenience. This is susceptible to XSS attacks in a production environment; `httpOnly` cookies would be preferred for hardened deployments. |
| 9 | **No pagination** | Goal lists, topic lists, and session history are fetched in full without server-side pagination. Performance may degrade with very large datasets. |
| 10 | **Playwright E2E tests create test data** | Each E2E test run creates new goals and sessions in the database. The database will accumulate test records over multiple runs; they are timestamped and isolated but not auto-cleaned. |
