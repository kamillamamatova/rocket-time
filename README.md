# Rocket Time

This repository contains the code for Rocket Time, a time management and goal-setting application. It includes a backend API and a frontend dashboard. The API provides endpoints for Google OAuth authentication, AI-powered chat functionality, and CRUD operations for goals and time logs.

## Project Structure

This is a monorepo containing several packages:

* `rocketTime/apps/server`: The backend API server, "rocket-time-server".
* `rocketTime/apps/web/app/(dashboard)/dashboard`: The frontend "Goal Setting Dashboard" application.
* `sqldump/`: Contains the MySQL database schema.

---

## Features

Based on the API documentation, the application supports:

* **Google OAuth:** User authentication via Google (`/api/auth/login`, `/api/auth/callback`).
* **AI Chat Agent:** An AI assistant to process natural language messages (`/api/agent/chat`) for tasks like:
    * Creating Google Calendar events
    * Adding goals/tasks
    * Planning your week
    * Prioritizing tasks
    * Getting productivity feedback
* **Goal Management:** CRUD operations for user goals (`/api/calendar/goals`).
* **Time Logging:** CRUD operations for time logs associated with goals (`/api/calendar/timelogs`).
* **Statistics:** An endpoint to get user productivity statistics (`/api/calendar/stats`).

---

## Tech Stack

Key technologies used in this project include:

* **Backend (Server):**
    * Node.js
    * Express
    * MySQL2 (mysql2)
    * Google Generative AI (`@google/generative-ai`)
    * Google APIs (`googleapis`)
    * Zod (for validation)
* **Frontend (Dashboard):**
    * React
    * Vite
    * TypeScript
    * `lucide-react` (for icons)
    * A component library based on `@radix-ui/*` (e.g., Dialog, Popover, Select)
    * `recharts` (for charts)
    * `react-hook-form` (for forms)

---

## Setup and Installation

### 1. Database Setup

The project uses a MySQL database.

1.  Create a database named `time`.
2.  Use the `sqldump/time_create.sql` file to create the necessary tables:
    * `users`: Stores user information.
    * `goals`: Stores user goals.
    * `timelogs`: Stores time log entries.
    * `oauth_credentials`: Stores user's Google OAuth tokens.

### 2. Backend (Server)

1.  Navigate to the server directory:
    ```bash
    cd rocketTime/apps/server
    ```
2.  Install the dependencies (assuming npm based on `package.json`):
    ```bash
    npm install
    ```
3.  Create a `.env` file and add the required environment variables:
    ```env
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
    GOOGLE_API_KEY=your_google_ai_api_key
    SESSION_SECRET=your_session_secret
    FRONTEND_URL=http://localhost:5173
    ```
    *(Note: You will also need to add your MySQL database credentials, though they are not listed in the API documentation).*
4.  Start the development server:
    ```bash
    npm run dev
    ```
   
    The server will run on `http://localhost:3000`.

### 3. Frontend (Dashboard)

1.  Navigate to the dashboard directory:
    ```bash
    cd rocketTime/apps/web/app/(dashboard)/dashboard
    ```
2.  Install the dependencies:
    ```bash
    npm i
    ```
   
3.  Start the development server:
    ```bash
    npm run dev
    ```
   
    The frontend will be accessible (likely at `http://localhost:5173`, based on the server's `FRONTEND_URL` environment variable).

---

## API Documentation

Full details for all API endpoints are available in the backend's API documentation file:
`rocketTime/apps/server/API_DOCUMENTATION.md`.
