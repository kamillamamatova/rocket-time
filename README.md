# Rocket Time

Rocket Time is a goal-setting and time-tracking app with a Node/Express API and a React/Vite dashboard. It supports Google OAuth login, AI-assisted planning, goal management, time logging, and productivity stats.

The app is now deployed with:

- Render for hosting
- Aiven for the MySQL database

## Project Structure

- `rocketTime/apps/server` - Express API
- `rocketTime/apps/web/app/(dashboard)/dashboard` - React dashboard
- `sqldump/` - MySQL schema files
- `render.yaml` - Render Blueprint config
- `DEPLOYMENT.md` - deployment notes for Render + Aiven

## Features

- Google OAuth authentication
- AI chat assistant for planning and productivity help
- Goal CRUD endpoints
- Time log CRUD endpoints
- Productivity statistics

## Tech Stack

### Backend

- Node.js
- Express
- MySQL2
- Google APIs
- `@google/generative-ai`
- Zod

### Frontend

- React
- Vite
- TypeScript
- Radix UI
- `react-hook-form`
- `recharts`
- `lucide-react`

## Deployment

### Hosting

- API: Render Web Service
- Frontend: Render Static Site
- Database: Aiven MySQL

### Render config

The repo includes [`render.yaml`](/Users/kamillamamatova/rocket-time/render.yaml) with:

- API root directory: `rocketTime/apps/server`
- API health check: `/health`
- Frontend build based on the dashboard app

### Database

Use [`sqldump/time_render.sql`](/Users/kamillamamatova/rocket-time/sqldump/time_render.sql) to initialize the hosted MySQL database on Aiven.

Aiven should be configured with TLS enabled. The server supports that with:

```env
MYSQL_SSL=true
MYSQL_SSL_REJECT_UNAUTHORIZED=true
```

## Local Development

### 1. Create the database

Create a MySQL database named `time`, then run:

```bash
mysql -u your_user -p < sqldump/time_render.sql
```

If you are using Aiven locally as well, use your Aiven host, port, username, and password.

### 2. Run the API

Go to [`rocketTime/apps/server`](/Users/kamillamamatova/rocket-time/rocketTime/apps/server) and create a `.env` file based on the values below:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/auth/callback
GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar
GOOGLE_API_KEY=your_google_ai_api_key

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=time
MYSQL_SSL=false
MYSQL_SSL_REJECT_UNAUTHORIZED=true

SESSION_SECRET=replace_with_a_long_random_secret
COOKIE_SAME_SITE=lax
```

Install and run:

```bash
cd rocketTime/apps/server
npm install
npm run dev
```

The API runs at `http://localhost:3001`.

### 3. Run the dashboard

Create a `.env` in [`rocketTime/apps/web/app/(dashboard)/dashboard`](/Users/kamillamamatova/rocket-time/rocketTime/apps/web/app/(dashboard)/dashboard):

```env
VITE_API_URL=http://localhost:3001
```

Install and run:

```bash
cd "rocketTime/apps/web/app/(dashboard)/dashboard"
npm install
npm run dev
```

The dashboard runs through Vite on its local dev port.

## Production Environment Variables

### API

```env
NODE_ENV=production
PORT=10000
SESSION_SECRET=your-long-random-secret
FRONTEND_URL=https://your-frontend.onrender.com
FRONTEND_URLS=https://your-frontend.onrender.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-api.onrender.com/auth/callback
GOOGLE_API_KEY=your_google_ai_api_key
MYSQL_HOST=your-aiven-host
MYSQL_PORT=your-aiven-port
MYSQL_USER=your-aiven-user
MYSQL_PASSWORD=your-aiven-password
MYSQL_DB=time
MYSQL_SSL=true
MYSQL_SSL_REJECT_UNAUTHORIZED=true
COOKIE_SAME_SITE=none
```

### Frontend

```env
VITE_API_URL=https://your-api.onrender.com
```

## Health Check

- API health endpoint: `GET /health`

## Documentation

- API docs: [`rocketTime/apps/server/API_DOCUMENTATION.md`](/Users/kamillamamatova/rocket-time/rocketTime/apps/server/API_DOCUMENTATION.md)
- Deployment guide: [`DEPLOYMENT.md`](/Users/kamillamamatova/rocket-time/DEPLOYMENT.md)
