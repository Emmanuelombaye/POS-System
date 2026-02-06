# Persistent Shift Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CASHIER SHIFT WORKFLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            1. COMPONENT MOUNT (useEffect)               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  checkActiveShift() async function runs                 │  │
│  │  ↓                                                       │  │
│  │  if (!currentUser?.id) return                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │    2. API CALL: GET /api/shifts/active/{cashier_id}    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Headers: { Authorization: Bearer {token} }             │  │
│  │  Response: { shift: {...}, stock_entries: [...] }       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│            ┌──────────────┴──────────────┐                       │
│            │                             │                       │
│       ✅ 200 OK                      ❌ Error/404                 │
│            │                             │                       │
│    ┌───────▼────────┐           ┌───────▼────────┐               │
│    │ Response Valid?│           │ Set Stage =    │               │
│    └───────┬────────┘           │ "start"        │               │
│            │                    └───────┬────────┘               │
│     YES ───┼─── NO                      │                        │
│      │     │                           │                        │
│   ┌──▼──┐  └──► "start"                │                        │
│   │open?│      Stage                   │                        │
│   └──┬──┘                               │                        │
│      │                                  │                        │
│  ✅ YES  NO ─────────────────────────►  │                        │
│      │                                  │                        │
│   ┌──▼──────────────────┐               │                        │
│   │ RESTORE SHIFT       │               │                        │
│   ├─────────────────────┤               │                        │
│   │ setShiftData()      │               │                        │
│   │ setStockEntries()   │               │                        │
│   │ setStage("active")  │               │                        │
│   │ log: [Shift         │               │                        │
│   │      Restored]      │               │                        │
│   └──┬──────────────────┘               │                        │
│      │                                  │                        │
│      └──────────────┬───────────────────┘                        │
│                     │                                            │
│      ┌──────────────▼──────────────┐                             │
│      │  setInitializing(false)     │                             │
│      │  (Render appropriate stage) │                             │
│      └──────────────┬──────────────┘                             │
│                     │                                            │
│                     ▼                                            │
│      ┌──────────────────────────┐                                │
│      │ RENDER BASED ON STAGE    │                                │
│      ├──────────────────────────┤                                │
│      │ if initializing → LOAD   │                                │
│      │ if stage=start → START   │                                │
│      │ if stage=active → ACTIVE │                                │
│      │ if stage=closing → DONE  │                                │
│      └──────────────────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## State Machine

```
                    ┌─────────────────┐
                    │   INITIALIZING  │ ← Component Mount
                    │   (Show Loader) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Check API for   │
                    │ Active Shift    │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
                 FOUND             NOT FOUND
                  │                   │
           ┌──────▼───────┐    ┌──────▼──────┐
           │ ACTIVE STAGE │    │ START STAGE │
           │ (Restore)    │    │ (New Shift) │
           └──────┬───────┘    └──────┬──────┘
                  │                   │
            ┌─────▼─────────────────────▼──┐
            │ User Workflow Continues      │
            │ - Add Sales                  │
            │ - Add Stock                  │
            │ - View Dashboard             │
            │ - Close Shift                │
            └─────┬─────────────────────┬──┘
                  │                     │
                  ▼                     ▼
            (Logout/Refresh)        (Close Shift)
                  │                     │
                  └───────┬─────────────┘
                          │
                   ┌──────▼──────┐
                   │  Next Login │
                   └──────┬──────┘
                          │
                   (Repeat Cycle)
```

## Component Data Flow

```
                    ┌──────────────────┐
                    │  currentUser     │ (from store)
                    └─────────┬────────┘
                              │
                    ┌─────────▼────────────┐
                    │  useEffect Hook      │
                    │  [currentUser.id]    │
                    │  [token]             │
                    └─────────┬────────────┘
                              │
                    ┌─────────▼────────────┐
                    │  checkActiveShift()  │
                    └─────────┬────────────┘
                              │
    ┌─────────────────────────┼──────────────────────────┐
    │                         │                          │
    ▼                         ▼                          ▼
┌──────────┐          ┌────────────────┐         ┌────────────┐
│ API Call │          │ Set State:     │         │ Set State: │
│          │          │ shiftData      │         │ initializing│
│ GET      │          │ stockEntries   │         │ = false    │
│ /api/    │          │ stage          │         │            │
│ shifts/  │          │ (active)       │         │ Then:      │
│ active/  │          │                │         │ Render     │
│ {id}     │          │ Log:           │         │            │
│          │          │ [Shift         │         │            │
│ Headers: │          │  Restored]     │         │            │
│ Auth     │          │                │         │            │
│          │          │ OR             │         │            │
│ Token:   │          │                │         │            │
│ from     │          │ Set State:     │         │            │
│ store/   │          │ stage="start"  │         │            │
│ localStorage│       │                │         │            │
└──────────┘          └────────────────┘         └────────────┘
    │                         │                          │
    └─────────────────────────┼──────────────────────────┘
                              │
                    ┌─────────▼────────────┐
                    │  Component Re-Render │
                    │  with New State      │
                    └─────────┬────────────┘
                              │
                    ┌─────────▼────────────┐
                    │  UI Updates:         │
                    │  - Initializing:     │
                    │    Show Loader       │
                    │  - Stage = start:    │
                    │    Show Start Button │
                    │  - Stage = active:   │
                    │    Show Workflow     │
                    └──────────────────────┘
```

## Timeline

```
T0:   User navigates to /cashier/shift

      [Browser]
      CashierShiftWorkflow component mounts
      └─► initializing = true
      └─► stage = "start" (default)

T1:   useEffect runs automatically

      [Browser]
      checkActiveShift() async function starts
      └─► Checks if currentUser?.id exists
      └─► Begins API fetch

T2:   [Component Renders]
      
      Shows: "Checking Shift Status" screen
      └─► Loader icon spinning
      └─► "Restoring your shift data..."

T3:   [Network]

      API Request: GET /api/shifts/active/user-id
      └─► Header: Authorization: Bearer {token}
      └─► Traveling to backend (port 4000)

T4:   [Backend Processing]

      Backend /api/shifts/active/{id} endpoint
      └─► Validates token
      └─► Queries database for open shifts
      └─► Returns shift + stock_entries

T5:   [Network]

      API Response: 200 OK (with data)
      └─► { shift: {...}, stock_entries: [...] }
      └─► Traveling back to frontend

T6:   [Browser - Data Received]

      safeJson() parses response
      └─► Checks if shift.status === "open"
      └─► YES: setStage("active")
      └─► Sets shiftData, stockEntries
      └─► Logs: [Shift Restored]

T7:   setInitializing(false)

      Signals initialization complete
      └─► Component knows to stop showing loader

T8:   [Component Re-Render]

      useEffect dependency [stage] changed
      └─► New stage = "active"
      └─► Triggers second useEffect
      └─► Starts polling updates every 5s

T9:   [UI Updates]

      Renders active shift workflow
      └─► Shows products list
      └─► Shows cart
      └─► Shows sales interface
      └─► Show close shift button

T10+: [Live Updates]

      Every 5 seconds:
      └─► fetchShiftData() called
      └─► Updates shiftData from API
      └─► UI re-renders with latest info

---

Timeline for error case:

T0-T3: Same as above

T4: [Backend Error]
    └─► Connection failed / Invalid token / etc

T5: [Error Response]
    └─► catch block catches error
    └─► console.error logs message

T6: [Fallback]
    └─► setStage("start")
    └─► User sees "Start Your Shift" button
    └─► Can manually proceed with new shift

T7: setInitializing(false)
    └─► Error handled gracefully
```

## Integration Points

```
┌──────────────────────────────────────────────────────────────┐
│                  CashierShiftWorkflow Component             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ NEW: Initialization Check (useEffect)               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Uses:                                               │   │
│  │  - currentUser from useAppStore()                   │   │
│  │  - token from useAppStore()                         │   │
│  │  - settings from useAppStore() (for formatting)     │   │
│  │                                                     │   │
│  │ Calls:                                              │   │
│  │  - fetch() to /api/shifts/active/{id}               │   │
│  │  - safeJson() to parse response                     │   │
│  │  - setShiftData() to store shift                    │   │
│  │  - setStockEntries() to store products              │   │
│  │  - setStage() to change workflow stage              │   │
│  │  - setInitializing() to track state                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ EXISTING: Workflow Stages (unchanged)               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ - Stage = "start": Show start button                │   │
│  │ - Stage = "active": Show workflow UI                │   │
│  │ - Stage = "closing": Show confirmation              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ EXISTING: Event Handlers (unchanged)                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ - handleStartShift()                                │   │
│  │ - handleAddToCart()                                 │   │
│  │ - handleRemoveFromCart()                            │   │
│  │ - handleAddSale()                                   │   │
│  │ - handleAddStock()                                  │   │
│  │ - handleCloseShift()                                │   │
│  │ - handleConfirmClose()                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         │                 │                    │
         ▼                 ▼                    ▼
    ┌─────────┐       ┌──────┐         ┌─────────────┐
    │  Store  │       │  API │         │ Animations  │
    ├─────────┤       ├──────┤         ├─────────────┤
    │ Token   │       │  GET │         │  Framer     │
    │ User    │       │ /api │         │  Motion     │
    │ Settings│       │shifts│         └─────────────┘
    └─────────┘       │active│
                      └──────┘
```

## Data Flow Example

```
SCENARIO: User has open shift, logs out, logs back in

1. LOGOUT
   ├─ Token cleared from store
   └─ Shift remains in database

2. LOGIN
   ├─ User navigates to /cashier/shift
   └─ Component mounts

3. useEffect Runs
   ├─ currentUser = { id: "user-cashier-001", ... }
   ├─ token = "eyJhbGciOiJ..." (from localStorage)
   └─ Calls checkActiveShift()

4. API Request
   ├─ GET /api/shifts/active/user-cashier-001
   ├─ Header: Authorization: Bearer eyJhbGciOiJ...
   └─ Reaches backend

5. Backend Processing
   ├─ Validates JWT token
   ├─ Queries: SELECT * FROM shifts 
   │   WHERE cashier_id = 'user-cashier-001' 
   │   AND status = 'open'
   ├─ Found! Returns shift data + stock_entries
   └─ Response: 200 OK

6. Frontend Response Handling
   ├─ safeJson(response) parses data
   ├─ data.shift = { shift_id, status: "open", ... }
   ├─ data.stock_entries = [ { product_id, opened_stock, ... }, ... ]
   ├─ if status === "open" → TRUE
   ├─ setShiftData(data.shift)
   ├─ setStockEntries(data.stock_entries)
   ├─ setStage("active")
   ├─ setInitializing(false)
   └─ console.log("[Shift Restored]", data.shift)

7. Re-render
   ├─ initializing = false (show active UI, not loader)
   ├─ stage = "active" (show workflow, not start button)
   └─ shiftData populated (show products + cart)

8. User Interface
   ├─ Products displayed with opening stock
   ├─ Cart ready for sales entry
   ├─ Close Shift button visible
   └─ User can continue working

9. Polling Starts
   ├─ useEffect [stage] dependency changed
   ├─ Starts fetchShiftData() every 5 seconds
   └─ Updates reflect any changes from admin
```

## Error Handling Flow

```
       checkActiveShift() called
              │
              ▼
       try block starts
              │
       ┌──────┴──────┐
       │             │
   SUCCESS         CATCH
       │             │
   ✅ Response  ❌ Error
   ✅ 200 OK       (network/token/
       │           server error)
       │             │
   parse JSON     console.error()
       │             │
   check shift      setStage
   status           ("start")
       │             │
    OPEN?        setInitializing
    /│\           (false)
   / │ \             │
YES │ NO           Render
   │   │          "Start Shift"
   │   │          (safe default)
   │   └─────►"start" stage
   │              │
   │          User can
   │        manually click
   │         "Start Shift"
   │          if needed
   │
   └─►Restore
       data
       │
       ├─ setShiftData()
       ├─ setStockEntries()
       ├─ setStage("active")
       ├─ setInitializing(false)
       │
       └─ Render active UI
```

---

This architecture ensures smooth, graceful shift restoration with proper error handling and user feedback throughout the process.
