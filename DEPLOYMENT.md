# Rocket Time Deployment

This project is ready to deploy on free tiers with:

- Render Static Site for the frontend
- Render Web Service for the API
- Aiven for the MySQL database

## Why this stack

- Render works well for the Node API and static frontend in this repo.
- Aiven gives you a managed MySQL connection, which means the current `mysql2` backend can keep working without a database rewrite.
- This keeps your app close to the code you already have.

## 1. Create the database

Use your existing Aiven MySQL service and create a database named `time` if you have not already.

Then run [`sqldump/time_render.sql`](/Users/kamillamamatova/rocket-time/sqldump/time_render.sql) against it.

Notes:

- Use the host, port, username, password, and database name from your Aiven service.
- Keep TLS enabled.
- [`sqldump/time_render.sql`](/Users/kamillamamatova/rocket-time/sqldump/time_render.sql) is the safer hosted version of the schema. It avoids the local-only reset behavior in [`sqldump/time_create.sql`](/Users/kamillamamatova/rocket-time/sqldump/time_create.sql).

## 2. Deploy the API on Render

Create a new Blueprint or Web Service from this repo.

If you use the included [`render.yaml`](/Users/kamillamamatova/rocket-time/render.yaml), Render will pick up:

- API root: `rocketTime/apps/server`
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/health`

Set these API environment variables in Render:

```env
NODE_ENV=production
PORT=10000
SESSION_SECRET=your-long-random-secret
FRONTEND_URL=https://your-frontend-name.onrender.com
FRONTEND_URLS=https://your-frontend-name.onrender.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-api-name.onrender.com/auth/callback
GOOGLE_API_KEY=your_google_ai_api_key
MYSQL_HOST=your_aiven_host
MYSQL_PORT=your_aiven_port
MYSQL_USER=your_aiven_user
MYSQL_PASSWORD=your_aiven_password
MYSQL_DB=time
MYSQL_SSL=true
MYSQL_SSL_REJECT_UNAUTHORIZED=true
COOKIE_SAME_SITE=none
```

## 3. Deploy the frontend on Render

Create a Static Site from this repo or let the Blueprint create it.

Render settings:

- Root directory: `rocketTime/apps/web/app/(dashboard)/dashboard`
- Build command: `npm ci && npm run build`
- Publish directory: `build`

Set this frontend environment variable:

```env
VITE_API_URL=https://your-api-name.onrender.com
```

## 4. Update Google OAuth

In Google Cloud Console, update the OAuth client:

- Authorized JavaScript origins:
  - `https://your-frontend-name.onrender.com`
  - `https://your-api-name.onrender.com`
- Authorized redirect URI:
  - `https://your-api-name.onrender.com/auth/callback`

## 5. Final checks

After both services are live:

1. Open the frontend URL.
2. Click Sign in with Google.
3. Confirm Google redirects back to the frontend after auth.
4. Check `https://your-api-name.onrender.com/health`.
5. Check login state with `https://your-api-name.onrender.com/auth/me`.

## Current limitation

Render's free web services spin down after inactivity, so the API may take a short time to wake up on the first request.

## Sources

- [Render free services](https://render.com/docs/free)
- [Render static sites](https://render.com/docs/static-sites)
- [Render monorepo root directories](https://render.com/docs/monorepo-support)
- [Render Blueprint spec](https://render.com/docs/blueprint-spec)
