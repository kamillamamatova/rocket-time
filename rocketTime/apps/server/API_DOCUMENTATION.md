# Rocket Time API Documentation

## Overview
This API provides endpoints for Google OAuth authentication, AI-powered chat functionality, and CRUD operations for goals and time logs.

## Base URL
```
http://localhost:3000
```

## Authentication
All routes except OAuth login require authentication via session cookies.

## Routes

### Authentication Routes (`/api/auth`)

#### `GET /api/auth/login`
Initiates Google OAuth flow. Redirects user to Google's authorization page.

**Response:** Redirects to Google OAuth

#### `GET /api/auth/callback`
Handles OAuth callback from Google. Creates or updates user account and stores OAuth credentials.

**Query Parameters:**
- `code` (string): Authorization code from Google

**Response:** Redirects to frontend URL

#### `GET /api/auth/me`
Get current authenticated user information.

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```

#### `POST /api/auth/logout`
Logout current user and clear session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Chat Routes (`/api/agent`)

#### `POST /api/agent/chat`
Send a message to the AI assistant for processing.

**Request Body:**
```json
{
  "message": "Create a meeting tomorrow at 2pm"
}
```

**Response:**
```json
{
  "intent": "CREATE_EVENT",
  "message": "Event 'Meeting' has been created successfully!",
  "eventId": "google-calendar-event-id"
}
```

**Supported Intents:**
- `CREATE_EVENT`: Creates Google Calendar events
- `ADD_TASK`: Adds new goals/tasks
- `PLAN_WEEK`: Generates weekly planning suggestions
- `PRIORITIZE`: Prioritizes tasks by deadline and importance
- `ASK_FEEDBACK`: Provides productivity feedback and statistics
- `SMALL_TALK`: General conversation

### Goals/Tasks Routes (`/api/calendar`)

#### `GET /api/calendar/goals`
Get all goals for the authenticated user.

**Query Parameters:**
- `status` (string): Filter by status (`not started`, `in progress`, `completed`)
- `category` (string): Filter by category (`productive`, `learning`, `exercise`, `social`, `entertainment`)
- `limit` (number): Number of results (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
{
  "goals": [
    {
      "id": 1,
      "user_id": "user-uuid",
      "title": "Learn React",
      "target_hours": 40,
      "category": "learning",
      "deadline": "2025-12-31",
      "progress_hours": 15.5,
      "status": "in progress",
      "description": "Complete React tutorial",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/calendar/goals/:id`
Get a specific goal by ID.

**Response:**
```json
{
  "goal": {
    "id": 1,
    "user_id": "user-uuid",
    "title": "Learn React",
    "target_hours": 40,
    "category": "learning",
    "deadline": "2025-12-31",
    "progress_hours": 15.5,
    "status": "in progress",
    "description": "Complete React tutorial",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### `POST /api/calendar/goals`
Create a new goal.

**Request Body:**
```json
{
  "title": "Learn React",
  "target_hours": 40,
  "category": "learning",
  "deadline": "2025-12-31",
  "description": "Complete React tutorial"
}
```

**Response:**
```json
{
  "goal": {
    "id": 1,
    "user_id": "user-uuid",
    "title": "Learn React",
    "target_hours": 40,
    "category": "learning",
    "deadline": "2025-12-31",
    "progress_hours": 0,
    "status": "not started",
    "description": "Complete React tutorial",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### `PUT /api/calendar/goals/:id`
Update an existing goal.

**Request Body:**
```json
{
  "title": "Learn React Advanced",
  "status": "in progress",
  "progress_hours": 20
}
```

**Response:**
```json
{
  "goal": {
    "id": 1,
    "user_id": "user-uuid",
    "title": "Learn React Advanced",
    "target_hours": 40,
    "category": "learning",
    "deadline": "2025-12-31",
    "progress_hours": 20,
    "status": "in progress",
    "description": "Complete React tutorial",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### `DELETE /api/calendar/goals/:id`
Delete a goal.

**Response:**
```json
{
  "message": "Goal deleted successfully"
}
```

### Time Logs Routes (`/api/calendar`)

#### `GET /api/calendar/timelogs`
Get time logs for the authenticated user.

**Query Parameters:**
- `goal_id` (number): Filter by specific goal
- `category` (string): Filter by category
- `start_date` (string): Filter logs from this date (YYYY-MM-DD)
- `end_date` (string): Filter logs until this date (YYYY-MM-DD)
- `limit` (number): Number of results (default: 50)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
{
  "timelogs": [
    {
      "id": 1,
      "user_id": "user-uuid",
      "goal_id": 1,
      "date": "2025-01-15",
      "duration_hr": 2.5,
      "category": "learning",
      "description": "React tutorial session",
      "goal_title": "Learn React"
    }
  ]
}
```

#### `POST /api/calendar/timelogs`
Create a new time log.

**Request Body:**
```json
{
  "goal_id": 1,
  "date": "2025-01-15",
  "duration_hr": 2.5,
  "category": "learning",
  "description": "React tutorial session"
}
```

**Response:**
```json
{
  "timelog": {
    "id": 1,
    "user_id": "user-uuid",
    "goal_id": 1,
    "date": "2025-01-15",
    "duration_hr": 2.5,
    "category": "learning",
    "description": "React tutorial session",
    "goal_title": "Learn React"
  }
}
```

#### `PUT /api/calendar/timelogs/:id`
Update an existing time log.

**Request Body:**
```json
{
  "duration_hr": 3.0,
  "description": "Extended React tutorial session"
}
```

#### `DELETE /api/calendar/timelogs/:id`
Delete a time log.

**Response:**
```json
{
  "message": "Time log deleted successfully"
}
```

### Statistics Route (`/api/calendar`)

#### `GET /api/calendar/stats`
Get user productivity statistics.

**Response:**
```json
{
  "goals": {
    "total_goals": 10,
    "completed_goals": 3,
    "in_progress_goals": 5,
    "not_started_goals": 2
  },
  "time": {
    "total_hours": 45.5,
    "total_logs": 20,
    "avg_session_length": 2.275
  },
  "categories": [
    {
      "category": "learning",
      "total_hours": 25.0,
      "log_count": 10
    },
    {
      "category": "productive",
      "total_hours": 15.5,
      "log_count": 8
    }
  ]
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Environment Variables

Required environment variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
GOOGLE_API_KEY=your_google_ai_api_key
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:5173
```

## Database Setup

Run the migration script to set up the required database tables:

```sql
-- Run the contents of src/migrations/add_oauth_tables.sql
```

## Usage Examples

### Frontend Integration

```javascript
// Login
window.location.href = '/api/auth/login';

// Check authentication status
const response = await fetch('/api/auth/me');
const { user } = await response.json();

// Send chat message
const chatResponse = await fetch('/api/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Create a meeting tomorrow at 2pm' })
});

// Get goals
const goalsResponse = await fetch('/api/calendar/goals');
const { goals } = await goalsResponse.json();

// Create a new goal
const newGoal = await fetch('/api/calendar/goals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Learn TypeScript',
    target_hours: 20,
    category: 'learning',
    deadline: '2025-06-01'
  })
});
```
