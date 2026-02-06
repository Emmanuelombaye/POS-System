# Wholesale Desk - Complete Backend Setup Guide

## Overview

The Wholesale Desk backend is built with:
- **Server**: Express.js (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Frontend**: React with TypeScript

## Step 1: Create the Database Table

### Option A: Using Supabase Dashboard (Recommended for Beginners)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to your project
3. Go to **SQL Editor** tab
4. Click **New Query**
5. Copy and paste the contents of `server/migrations/001_create_wholesale_summaries.sql`
6. Click **Run**

### Option B: Using SQL Command Line

If you have psql installed:

```bash
psql -h db.glskbegsmdrylrhczpyy.supabase.co -U postgres -d postgres < server/migrations/001_create_wholesale_summaries.sql
```

## Step 2: Configure Environment Variables

### Frontend (.env)

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:4000
```

For production, change to your backend URL:
```env
VITE_API_URL=https://api.yourdomain.com
```

### Backend (server/.env)

The server/.env file already has the necessary configuration:

```env
SUPABASE_URL=https://glskbegsmdrylrhczpyy.supabase.co
SUPABASE_KEY=sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ
PORT=4000
```

## Step 3: Verify Database Connection

Test if the server can connect to the database:

```bash
cd server
npm run dev
```

You should see:
```
Eden Drop 001 backend listening on port 4000
```

Test the health endpoint:

```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","service":"eden-top-backend","database":"supabase"}
```

## Step 4: Start Both Frontend and Backend

### Terminal 1 - Backend:
```bash
cd server
npm run dev
```

### Terminal 2 - Frontend:
```bash
npm run dev
```

Access the app at: `http://localhost:5173`

## Step 5: Test the Wholesale Desk

1. Log in as an admin user
2. Navigate to Admin Dashboard
3. Click the **"→ Wholesale Desk"** button
4. Add a daily summary:
   - Select a branch
   - Choose a date
   - Enter cash and M-Pesa amounts
   - Click "Save Summary"
5. View the saved summary in the display section
6. Generate a report and test copy/print functionality

## API Endpoints Reference

### GET /wholesale-summaries
Retrieve all wholesale summaries

```bash
curl http://localhost:4000/wholesale-summaries
```

Optional filters:
```bash
# Filter by branch
curl http://localhost:4000/wholesale-summaries?branch=Branch%201

# Filter by date
curl http://localhost:4000/wholesale-summaries?date=2026-01-29
```

### POST /wholesale-summaries
Create a new wholesale summary

```bash
curl -X POST http://localhost:4000/wholesale-summaries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-01-29",
    "branch": "Branch 1",
    "cashReceived": 50000,
    "mpesaReceived": 5000
  }'
```

### GET /wholesale-summaries/:id
Retrieve a specific summary

```bash
curl http://localhost:4000/wholesale-summaries/550e8400-e29b-41d4-a716-446655440000
```

### DELETE /wholesale-summaries/:id
Delete a summary

```bash
curl -X DELETE http://localhost:4000/wholesale-summaries/550e8400-e29b-41d4-a716-446655440000
```

## Troubleshooting

### Backend won't start
- Check if port 4000 is in use: `netstat -ano | findstr :4000`
- Kill the process: `taskkill /PID <PID> /F`
- Ensure Supabase credentials in `server/.env` are correct

### Frontend can't reach backend
- Check if backend is running on `http://localhost:4000`
- Verify `.env` has `VITE_API_URL=http://localhost:4000`
- Check browser console for CORS errors

### Database connection fails
- Verify Supabase project is active
- Check internet connection
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `server/.env`

### "Table does not exist" error
- Run the SQL migration again
- Verify the query ran successfully in Supabase dashboard

## Security Considerations

1. **Production Deployment**:
   - Use environment variables for all secrets
   - Enable RLS policies in Supabase
   - Use authenticated requests only (add JWT if needed)
   - Change `VITE_API_URL` to your production backend URL

2. **Row Level Security (RLS)**:
   - The migration enables RLS by default
   - Policies allow authenticated users access
   - Add more restrictive policies if needed

3. **Data Validation**:
   - Backend validates branch values
   - Frontend validates all inputs before sending
   - Use TypeScript for type safety

## Production Deployment

### Backend (Node.js)
```bash
cd server
npm install --production
npm run build
npm run start
```

Deploy to:
- Heroku, Railway, Vercel, or your own server
- Update `VITE_API_URL` in frontend to your backend URL

### Frontend (React)
```bash
npm run build
npm run preview
```

Deploy to:
- Vercel, Netlify, GitHub Pages, or any static host
- Build with: `npm run build`

## Files Created/Modified

### New Files:
- `src/components/wholesale/WholesaleDesk.tsx` - Main page with API integration
- `src/components/wholesale/WholesaleSummaryCard.tsx` - Form component
- `src/components/wholesale/WholesaleSummaryDisplay.tsx` - Display component
- `src/components/wholesale/TextReportGenerator.tsx` - Report generator
- `server/src/index.ts` - Updated with wholesale endpoints
- `server/migrations/001_create_wholesale_summaries.sql` - Database schema
- `WHOLESALE_SETUP.md` - Setup documentation
- `.env.example` - Environment variables template

### Modified Files:
- `src/App.tsx` - Added `/admin/wholesale` route
- `src/pages/admin/AdminDashboard.tsx` - Added navigation button

## Support

For issues or questions:
1. Check the browser console for errors
2. Check the server logs for API errors
3. Verify all environment variables are set correctly
4. Ensure the database table exists in Supabase
