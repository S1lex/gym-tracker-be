# FitGuard Backend API

A robust backend API for a gym workout tracking application built with Node.js, Express.js, TypeScript, and Supabase.

## Features

- 🔐 **Authentication**: Secure JWT-based authentication using Supabase Auth (register/login)
- 💪 **Workout Management**: Create, read, update, and delete workouts
- 🏋️ **Exercise Library**: Browse exercises (public endpoint)
- 📊 **Set Tracking**: Add sets to workouts
- 🛡️ **Security**: Helmet.js, CORS, rate limiting, and input validation
- 📱 **Multi-platform**: Supports web (localhost:3000) and React Native (localhost:8081) clients

## Technology Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database & BaaS**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure your `.env` file with your Supabase credentials:
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Set up the database schema in Supabase:
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Run the SQL from `supabase-schema.sql`

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Register a new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Workouts (Protected - requires Bearer token)
- `GET /api/workouts` - Get all workouts for the authenticated user
- `GET /api/workouts/:id` - Get a single workout by ID, including all associated sets
- `POST /api/workouts` - Create a new workout session
  ```json
  {
    "name": "Chest Day",
    "start_time": "2024-01-01T10:00:00Z"
  }
  ```
- `PUT /api/workouts/:id` - Update a workout (e.g., set end_time)
  ```json
  {
    "end_time": "2024-01-01T11:30:00Z"
  }
  ```
- `DELETE /api/workouts/:id` - Delete a workout and all associated sets

### Sets (Protected - requires Bearer token)
- `POST /api/sets` - Add a new set to a workout
  ```json
  {
    "workout_id": "uuid",
    "exercise_id": "uuid",
    "set_number": 1,
    "reps": 10,
    "weight": 100.5,
    "duration_seconds": null
  }
  ```

### Exercises (Public - no authentication required)
- `GET /api/exercises` - Get all available exercises
  - Query params: `?category=Chest&search=bench`

### Health Check
- `GET /health` - Check server status

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

The access token is returned from the `/api/auth/register` or `/api/auth/login` endpoints.

## Database Schema

The application uses the following tables:

- `profiles` - User profile information
- `workouts` - Workout sessions
- `workout_sets` - Individual sets within workouts
- `exercises` - Exercise library (master list)

See `supabase-schema.sql` for the complete schema definition with RLS policies.

## API Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Features

- **Helmet.js**: Sets various HTTP headers for security
- **CORS**: Configured for localhost:3000 (web) and localhost:8081 (React Native)
- **Rate Limiting**: Prevents abuse (100 requests per 15 minutes by default)
- **JWT Authentication**: All protected endpoints require valid Supabase JWT tokens
- **Row Level Security**: Database-level security via Supabase RLS policies

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/    # Express middleware (auth, error handling)
│   ├── routes/         # Route definitions
│   ├── utils/          # Utility functions (Supabase client)
│   ├── types/          # TypeScript types
│   ├── app.ts          # Express app setup
│   └── index.ts        # Entry point
├── .env.example        # Environment variables template
├── package.json
├── tsconfig.json
└── supabase-schema.sql # Database schema
```

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check without building

## License

ISC
