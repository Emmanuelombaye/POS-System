# Quick Reference - Wholesale Desk Backend

## 🚀 Quick Start (3 Steps)

### Step 1: Set Up Database (One-time)
Copy & paste in [Supabase SQL Editor](https://app.supabase.com/):
```sql
CREATE TABLE public.wholesale_summaries (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), date TEXT NOT NULL, branch TEXT NOT NULL CHECK (branch IN ('Branch 1', 'Branch 2', 'Branch 3')), cash_received INTEGER NOT NULL DEFAULT 0, mpesa_received INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX idx_ws_branch ON public.wholesale_summaries(branch);
CREATE INDEX idx_ws_date ON public.wholesale_summaries(date);
CREATE INDEX idx_ws_created ON public.wholesale_summaries(created_at DESC);
ALTER TABLE public.wholesale_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_view" ON public.wholesale_summaries FOR SELECT USING (true);
CREATE POLICY "ws_insert" ON public.wholesale_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "ws_delete" ON public.wholesale_summaries FOR DELETE USING (true);
GRANT SELECT, INSERT, DELETE ON public.wholesale_summaries TO anon, authenticated;
```

### Step 2: Create .env
Create file: `.env` in root directory
```env
VITE_API_URL=http://localhost:4000
```

### Step 3: Run Both
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
npm run dev
```

Access: http://localhost:5173 → Login as admin → Click "Wholesale Desk"

## 📡 API Endpoints

| Method | URL | Purpose | Response |
|--------|-----|---------|----------|
| GET | `/wholesale-summaries` | List all | Array of summaries |
| GET | `/wholesale-summaries?branch=Branch%201` | Filter by branch | Filtered array |
| GET | `/wholesale-summaries?date=2026-01-29` | Filter by date | Filtered array |
| POST | `/wholesale-summaries` | Create | Created summary |
| GET | `/wholesale-summaries/:id` | Get one | Single summary |
| DELETE | `/wholesale-summaries/:id` | Delete | Success message |

## 💾 Database Schema

```
wholesale_summaries
├── id (UUID, Primary Key)
├── date (TEXT, not null)
├── branch (TEXT, "Branch 1" | "Branch 2" | "Branch 3")
├── cash_received (INTEGER, default 0)
├── mpesa_received (INTEGER, default 0)
├── created_at (TIMESTAMP, auto)
└── updated_at (TIMESTAMP, auto)
```

## 📝 Example API Calls

### Create Summary
```bash
curl -X POST http://localhost:4000/wholesale-summaries \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-here",
    "date": "2026-01-29",
    "branch": "Branch 1",
    "cashReceived": 50000,
    "mpesaReceived": 5000
  }'
```

### Get All
```bash
curl http://localhost:4000/wholesale-summaries
```

### Filter by Branch
```bash
curl "http://localhost:4000/wholesale-summaries?branch=Branch%201"
```

### Delete
```bash
curl -X DELETE http://localhost:4000/wholesale-summaries/uuid-here
```

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /wholesale-summaries" | Backend not running - `cd server && npm run dev` |
| "Network Error" when saving | Check `.env` has `VITE_API_URL=http://localhost:4000` |
| "Table does not exist" | Run SQL migration in Supabase dashboard |
| Port 4000 already in use | Change PORT in `server/.env` or kill process |
| CORS Error | Ensure backend is on `http://localhost:4000` |

## 📂 Key Files

**Frontend (React)**
- `src/components/wholesale/WholesaleDesk.tsx` ← API integration here
- `src/components/wholesale/WholesaleSummaryCard.tsx`
- `src/components/wholesale/WholesaleSummaryDisplay.tsx`
- `src/components/wholesale/TextReportGenerator.tsx`

**Backend (Express)**
- `server/src/index.ts` ← Endpoints at lines 105-175

**Database**
- `server/migrations/001_create_wholesale_summaries.sql`

**Docs**
- `BACKEND_SETUP.md` - Full setup guide
- `BACKEND_IMPLEMENTATION.md` - Implementation details
- `WHOLESALE_SETUP.md` - API reference

## 🔐 Security

✅ Admin-only (RequireRole guard)  
✅ RLS enabled on database  
✅ Type-safe TypeScript  
✅ Input validation  

## 📊 Response Format

### POST Response (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2026-01-29",
  "branch": "Branch 1",
  "cash_received": 50000,
  "mpesa_received": 5000,
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z"
}
```

### GET Response (200 OK)
```json
[
  {
    "id": "uuid",
    "date": "2026-01-29",
    "branch": "Branch 1",
    "cash_received": 50000,
    "mpesa_received": 5000,
    "created_at": "2026-01-29T10:00:00Z"
  }
]
```

## ⚡ Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| VITE_API_URL | http://localhost:4000 | Frontend only (local dev) |
| SUPABASE_URL | https://glskbegsmdrylrhczpyy... | Backend only |
| SUPABASE_KEY | sb_publishable_... | Backend only |
| PORT | 4000 | Backend server port |

## 🧪 Test Checklist

- [ ] Database table created in Supabase
- [ ] .env file created with VITE_API_URL
- [ ] Backend running: `npm run dev` in server folder
- [ ] Frontend running: `npm run dev` in root
- [ ] Can login as admin
- [ ] Can click "Wholesale Desk" button
- [ ] Can add daily summary
- [ ] Summary appears below form
- [ ] Can generate report
- [ ] Can copy/print report

## 🚢 Production Deployment

1. **Backend**: Deploy to Heroku/Railway/Vercel
2. **Update**: Change `VITE_API_URL` to your backend URL
3. **Frontend**: Deploy to Vercel/Netlify
4. **Test**: Verify summaries save and load

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Check terminal for server logs
3. Verify Supabase table exists
4. Test with cURL: `curl http://localhost:4000/health`
5. Read `BACKEND_SETUP.md` for detailed troubleshooting

---

✅ Backend is ready! Start with Step 1 above.
