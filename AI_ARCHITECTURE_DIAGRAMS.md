# AI Assistant Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Admin Interface (ModernAdminDashboard)            │   │
│  │                                                            │   │
│  │  Overview | Users | Branches | Products | Sales | ...    │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🤖 AI ASSISTANT CHAT WINDOW (Bottom Right)              │   │
│  │  ├─ Admin Role Check ✅                                   │   │
│  │  ├─ Message History                                       │   │
│  │  ├─ Input: "Low stock items"                              │   │
│  │  ├─ Response: [AI-generated insights]                    │   │
│  │  └─ Minimize/Close Controls                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓ (HTTPS)
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND SERVER (Port 4000)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  POST /api/ai/chat                                              │
│  ├─ Authenticate: JWT Token ✅                                   │
│  ├─ Authorize: Admin Role ✅                                     │
│  └─ Process Query                                               │
│     │                                                            │
│     ├─ gatherAIContext()                                        │
│     │  ├─ Fetch from products table                             │
│     │  ├─ Fetch from shift_stock_entries                        │
│     │  ├─ Fetch from transactions (sales)                       │
│     │  ├─ Calculate: Low-stock items                            │
│     │  ├─ Calculate: Top-selling products                       │
│     │  ├─ Calculate: Cashier discrepancies                      │
│     │  └─ Return: Context summary                              │
│     │                                                            │
│     ├─ Call OpenAI API                                          │
│     │  ├─ System Prompt: "You are a POS AI assistant"          │
│     │  ├─ Context: [Low stock, sales, variance data]          │
│     │  ├─ User Query: [Admin's question]                       │
│     │  └─ Get: GPT-4 mini response                             │
│     │                                                            │
│     ├─ Optional: Log to ai_logs table                           │
│     │  └─ Save: admin_id, query, response, timestamp            │
│     │                                                            │
│     └─ Return Response to Frontend                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
          ↓                         ↓                    ↓
    ┌─────────────┐        ┌──────────────┐   ┌──────────────────┐
    │  SUPABASE   │        │  OPENAI API  │   │  OPTIONAL: LOGS  │
    │  DATABASE   │        │  (GPT-4 mini)│   │   (Audit Trail)  │
    ├─────────────┤        ├──────────────┤   ├──────────────────┤
    │ - products  │        │ Processing   │   │ - ai_logs table  │
    │ - shifts    │        │ User query   │   │ - Query history  │
    │ - sales     │        │ + Context    │   │ - Admin activity │
    │ - users     │        │ = Response   │   │ - Timestamps     │
    │ - ai_logs   │        │              │   │                  │
    └─────────────┘        └──────────────┘   └──────────────────┘
```

---

## Message Flow Sequence

```
┌─────────────┐                                      ┌──────────────┐
│   ADMIN     │                                      │   OPENAI     │
│  (Browser)  │          BACKEND (Node.js)           │  (GPT-4 API) │
└──────┬──────┘                                      └──────┬───────┘
       │                                                    │
       │  1. User Types Query                              │
       │  "Show low stock items"                           │
       │                                                    │
       ├─────────────────────────────────────────────────>│
       │  2. POST /api/ai/chat                            │
       │     {query: "Show low stock items"}              │
       │     Headers: {Authorization: "Bearer <token>"}   │
       │                                                    │
       │     3. Authenticate & Authorize                  │
       │        ✅ Valid JWT Token?                        │
       │        ✅ User role === "admin"?                  │
       │                                                    │
       │     4. Gather Context                            │
       │        - Query products table                     │
       │        - Query shift_stock_entries                │
       │        - Calculate low-stock items                │
       │        - Identify discrepancies                   │
       │                                                    │
       │     5. Build System Prompt                        │
       │        "You are a POS AI assistant"              │
       │        "Current data: {context}"                 │
       │                                                    │
       │────────────────────────────────────────────────>│
       │  6. Send to OpenAI                               │
       │     - System: POS assistant role                 │
       │     - User: Admin's question                     │
       │     - Context: System data                       │
       │     - Model: gpt-4o-mini                         │
       │                                                    │
       │<────────────────────────────────────────────────│
       │  7. Receive Response                             │
       │     "Found 3 low-stock items:..."                │
       │                                                    │
       │     8. Log Interaction (optional)                │
       │        INSERT INTO ai_logs (admin_id, query...)  │
       │                                                    │
       │<────────────────────────────────────────────────│
       │  9. Response to Frontend                         │
       │     {                                             │
       │       response: "Found 3 low-stock...",          │
       │       context: {lowStockCount: 3, ...}           │
       │     }                                             │
       │                                                    │
       │  10. Display in Chat Window                       │
       │      - Show message with timestamp                │
       │      - Auto-scroll to bottom                      │
       │      - Store in message history                   │
       │                                                    │
```

---

## Data Context Structure

```
┌─────────────────────────────────────────────────────────┐
│        gatherAIContext() - What AI Sees                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ 1. PRODUCTS (All Active Items)                          │
│    ├─ Name: "Beef"                                      │
│    ├─ Stock: 8kg                                        │
│    ├─ Threshold: 10kg                                   │
│    └─ Status: ⚠️ LOW STOCK                              │
│                                                           │
│ 2. LOW STOCK ITEMS (Auto-Flagged)                       │
│    ├─ Beef: 8kg (threshold 10kg)                        │
│    ├─ Goat: 9.5kg (threshold 10kg)                      │
│    └─ Offal: 5kg (threshold 10kg)                       │
│                                                           │
│ 3. RECENT SHIFTS (Last 7 Days)                          │
│    ├─ Shift 001 (John, 2026-02-03)                      │
│    │  ├─ Opening: 50kg                                  │
│    │  ├─ Added: 25kg                                    │
│    │  ├─ Sold: 56kg                                     │
│    │  ├─ Closing: 19kg                                  │
│    │  └─ Variance: +2kg ⚠️                               │
│    └─ ...more shifts...                                 │
│                                                           │
│ 4. SALES DATA (Last 7 Days)                             │
│    ├─ Beef: 120kg sold (42 transactions)                │
│    ├─ Goat: 95kg sold (38 transactions)                 │
│    ├─ Offal: 35kg sold (22 transactions)                │
│    └─ ...more products...                               │
│                                                           │
│ 5. DISCREPANCIES (Variance > 0.1kg)                     │
│    ├─ Shift 001: Beef variance 2.5kg                    │
│    ├─ Shift 003: Goat variance -1.8kg                   │
│    └─ ...flagged shifts...                              │
│                                                           │
│ 6. TOP SELLING ITEMS                                    │
│    ├─ #1: Beef (120kg, $2400 revenue)                   │
│    ├─ #2: Goat (95kg, $1900 revenue)                    │
│    └─ #3: Offal (35kg, $525 revenue)                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
        ↓ Formatted as text context
        ↓ Sent to GPT-4 with system prompt
        ↓ AI generates actionable response
        ↓ Returns to admin
```

---

## Component Hierarchy

```
ModernAdminDashboard
│
├─ Navigation Tabs
│  ├─ Overview
│  ├─ Users
│  ├─ Branches
│  ├─ Products
│  ├─ Sales
│  └─ ...
│
├─ [ROLE CHECK] IsAdmin?
│  │  No → Don't render AdminAIAssistant
│  │  Yes ↓
│  │
│  └─ AdminAIAssistant (Fixed bottom-right)
│     │
│     ├─ CardHeader (Title bar)
│     │  ├─ Minimize button
│     │  ├─ Maximize button
│     │  └─ Close button
│     │
│     ├─ CardContent (Messages)
│     │  ├─ System message (initial)
│     │  ├─ User message
│     │  ├─ AI response
│     │  ├─ Loading spinner
│     │  └─ Error alert
│     │
│     └─ Form (Input area)
│        ├─ Input field
│        ├─ Send button
│        └─ Help hints
│
└─ Rest of dashboard (unaffected)
```

---

## Authentication & Authorization Flow

```
┌────────────────┐
│ User Logs In   │
└────────┬───────┘
         │
         ├─ POST /api/auth/login
         │  ├─ Send: userId, password
         │  └─ Receive: JWT token
         │
         ├─ Store token in localStorage
         │
         └─ Redirect to Dashboard
            │
            ├─ Decode JWT token
            │  ├─ Extract: userId
            │  ├─ Extract: role (admin/manager/cashier)
            │  └─ Store in Zustand (appStore)
            │
            ├─ Render Dashboard
            │  │
            │  ├─ Check: user.role === "admin" ?
            │  │  ├─ Yes → Render AdminAIAssistant ✅
            │  │  └─ No → Hide AdminAIAssistant 🚫
            │  │
            │  └─ Admin clicks "Send" message
            │     │
            │     ├─ Extract token from localStorage
            │     ├─ POST /api/ai/chat
            │     │  ├─ Body: {query: "..."}
            │     │  └─ Headers: {Authorization: "Bearer <token>"}
            │     │
            │     ├─ Backend receives request
            │     │  │
            │     │  ├─ authenticateToken middleware
            │     │  │  ├─ Parse token
            │     │  │  ├─ Verify signature
            │     │  │  └─ Attach user to request
            │     │  │
            │     │  └─ authorizeRoles('admin') middleware
            │     │     ├─ Check: user.role === 'admin'?
            │     │     ├─ Yes → Continue ✅
            │     │     └─ No → Return 403 Forbidden 🚫
            │     │
            │     └─ Process AI request (if authorized)
            │
            └─ Display response in chat
```

---

## Database Relationships

```
PRODUCTS TABLE
├─ id
├─ name
├─ price
├─ stock_kg          ◄─── Read by AI context
├─ low_stock_threshold_kg
└─ isActive

USERS TABLE
├─ id
├─ name
├─ role (admin/manager/cashier)
└─ ...

SHIFTS TABLE
├─ id
├─ cashier_id ──────────────┐
└─ ...                       │
                             │
SHIFT_STOCK_ENTRIES TABLE    │
├─ id                        │
├─ shift_id ◄────────────────┘
├─ product_id ──────────────┐
├─ opening_stock            ├─── Read by AI context
├─ added_stock              │
├─ sold_stock               │
├─ closing_stock            │
├─ variance                 │
└─ shift_date               │
                             │
PRODUCTS TABLE              │
├─ id ◄──────────────────────┘
├─ name
└─ ...

TRANSACTIONS TABLE
├─ id
├─ product_id ──────────────┐
├─ quantity_kg              ├─── Read by AI context
├─ total_price              │
└─ transaction_date         │
                             │
PRODUCTS TABLE              │
├─ id ◄──────────────────────┘
├─ name
└─ ...

AI_LOGS TABLE (Optional)
├─ id
├─ admin_id ─────────────┐
├─ query                 ├─── Written by AI endpoint
├─ response              │
├─ context_summary       │
└─ created_at            │
                          │
USERS TABLE             │
├─ id ◄──────────────────┘
├─ name
├─ role
└─ ...
```

---

## Error Handling Flow

```
┌──────────────────────────┐
│  Admin Sends Query       │
└────────────┬─────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Validate Input? │
    └────┬────────┬───┘
         │ Empty? │
         │   ▼    │
         │  Error │
         │   ◄────┘
         │
    Yes │ Valid
        ▼
    ┌──────────────────┐
    │ Auth + Auth OK?  │
    ├──────┬──────┬────┤
    │ No   │ Yes  │    │
    │  ▼   │  ▼   │    │
    │ 401  │  ▼   │    │
    │ or   │      │    │
    │ 403  │      │    │
    └──────┼──────┘    │
           │           │
      Error │ Continue │
        ◄───┘           │
                        ▼
             ┌──────────────────┐
             │ Gather Context   │
             │ from Database    │
             └────┬──────────┬──┘
                  │ DB Error │
                  │    ▼     │
                  │  Error   │
                  │   ◄──────┘
                  │
              Yes │ Success
                  ▼
             ┌──────────────────┐
             │ Call OpenAI API  │
             └────┬──────────┬──┘
                  │ API Err? │
                  │    ▼     │
                  │  Error   │
                  │   ◄──────┘
                  │
              Yes │ Success
                  ▼
             ┌──────────────────┐
             │ Format Response  │
             │ & Log (optional) │
             └────┬─────────────┘
                  │
              Yes │ Success
                  ▼
             ┌──────────────────┐
             │ Return Response  │
             │ to Frontend      │
             └────┬─────────────┘
                  │
                  ▼
             ┌──────────────────┐
             │ Display in Chat  │
             │ with Timestamp   │
             └──────────────────┘
```

---

## API Response Structure

```
┌─────────────────────────────────────────┐
│      POST /api/ai/chat Response         │
├─────────────────────────────────────────┤
│                                         │
│  {                                      │
│    "response": "Found 3 low-stock...", │
│    "context": {                         │
│      "lowStockCount": 3,                │
│      "discrepancyCount": 2,             │
│      "topSellingItems": [               │
│        ["Beef", {qty: 120}],            │
│        ["Goat", {qty: 95}],             │
│        ["Offal", {qty: 35}]             │
│      ]                                  │
│    }                                    │
│  }                                      │
│                                         │
└─────────────────────────────────────────┘
           ↓ Displayed as:

    ┌─────────────────────────────┐
    │ Found 3 low-stock items:    │
    │ - Beef: 8kg (threshold 10)  │
    │ - Goat: 9.5kg (threshold 10)│
    │ - Offal: 5kg (threshold 10) │
    │                             │
    │ Recommend ordering beef...  │
    │                             │
    │ [14:35]                     │
    └─────────────────────────────┘
```

---

## Deployment Topology

```
PRODUCTION ENVIRONMENT

┌─────────────────────────────────────────┐
│  VERCEL / NETLIFY (Frontend)            │
│  URL: app.edentop.com                   │
│  ├─ React + Vite                        │
│  ├─ AdminAIAssistant component          │
│  └─ Authentication via JWT              │
└────────────────┬────────────────────────┘
                 │
        HTTPS    │    (Bearer token in headers)
                 ▼
┌─────────────────────────────────────────┐
│  HEROKU / RAILWAY (Backend)             │
│  URL: api.edentop.com                   │
│  ├─ Node.js + Express                   │
│  ├─ /api/ai/chat endpoint               │
│  ├─ JWT authentication                  │
│  └─ OPENAI_API_KEY in env               │
└────────────┬──────────────┬─────────────┘
             │              │
      HTTPS  │              │  HTTPS
             ▼              ▼
    ┌──────────────┐  ┌──────────────────┐
    │  SUPABASE    │  │   OPENAI API     │
    │  PostgreSQL  │  │   GPT-4 mini     │
    │  Database    │  │   Inference      │
    └──────────────┘  └──────────────────┘
```

---

**Note:** All diagrams show the complete system architecture. For smaller deployments, the database can be local, and the backend/frontend can run on the same server.
