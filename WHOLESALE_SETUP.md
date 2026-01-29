# Wholesale Desk - Backend Setup

## Database Schema

Create the `wholesale_summaries` table in your Supabase database:

```sql
CREATE TABLE wholesale_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL,
  branch TEXT NOT NULL CHECK (branch IN ('Branch 1', 'Branch 2', 'Branch 3')),
  cash_received INTEGER NOT NULL DEFAULT 0,
  mpesa_received INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_wholesale_summaries_branch ON wholesale_summaries(branch);
CREATE INDEX idx_wholesale_summaries_date ON wholesale_summaries(date);
```

## Environment Variables

Add to your `.env` file (if not already present):

```env
# Supabase Configuration
SUPABASE_URL=https://glskbegsmdrylrhczpyy.supabase.co
SUPABASE_KEY=sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ

# API Configuration
VITE_API_URL=http://localhost:4000
```

For production, update `VITE_API_URL` to your production backend URL.

## API Endpoints

### Get All Wholesale Summaries
```
GET /wholesale-summaries
```

Query parameters (optional):
- `branch` - Filter by branch (e.g., "Branch 1")
- `date` - Filter by date (e.g., "2026-01-29")

**Response:**
```json
[
  {
    "id": "uuid-string",
    "date": "2026-01-29",
    "branch": "Branch 1",
    "cash_received": 43500,
    "mpesa_received": 1000,
    "created_at": "2026-01-29T10:00:00Z"
  }
]
```

### Create Wholesale Summary
```
POST /wholesale-summaries
Content-Type: application/json

{
  "id": "uuid-string",
  "date": "2026-01-29",
  "branch": "Branch 1",
  "cashReceived": 43500,
  "mpesaReceived": 1000
}
```

**Response:** 201 Created with the created summary object

### Get Single Summary
```
GET /wholesale-summaries/:id
```

**Response:** 200 OK with summary object

### Delete Summary
```
DELETE /wholesale-summaries/:id
```

**Response:** 200 OK with success message

## Running the Backend

```bash
cd server
npm install
npm run dev
```

The backend will start on `http://localhost:4000`

## Frontend Integration

The frontend (`WholesaleDesk` component) automatically:
1. Fetches summaries on mount via `GET /wholesale-summaries`
2. Saves new summaries via `POST /wholesale-summaries`
3. Uses `VITE_API_URL` environment variable for API calls
4. Shows loading and error states

## Type Definitions

The `DailySummary` interface used throughout:

```typescript
interface DailySummary {
  id: string;
  date: string;
  branch: "Branch 1" | "Branch 2" | "Branch 3";
  cashReceived: number;
  mpesaReceived: number;
}
```

## Testing

Once set up, you can test the endpoints using curl or Postman:

```bash
# Get all summaries
curl http://localhost:4000/wholesale-summaries

# Create a summary
curl -X POST http://localhost:4000/wholesale-summaries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-id",
    "date": "2026-01-29",
    "branch": "Branch 1",
    "cashReceived": 50000,
    "mpesaReceived": 5000
  }'
```

## Security Notes

- Ensure Supabase Row Level Security (RLS) policies are configured for `wholesale_summaries` table
- Only admin users should be able to access wholesale endpoints (enforce in frontend RouteRole guard)
- Backend should validate branch values and amounts before storing
- Consider adding authentication tokens to backend requests if needed
