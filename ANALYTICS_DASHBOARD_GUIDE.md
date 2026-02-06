# Analytics Dashboard - Quick Reference

## Overview
A focused, on-demand Analytics Dashboard showing real-time business metrics and insights. Data only updates when you click the **Refresh** button.

## Location
- **Admin Dashboard**: Main menu → **ANALYTICS** tab
- **Direct URL**: `/analytics` (requires admin role)

## Key Features

### 📊 Metrics Displayed
1. **Total Sales** - Total revenue for the selected date (KES currency)
2. **Profit (Est.)** - Estimated profit at ~35% margin (KES currency)
3. **Refunds** - Total refunds/voids for the day (KES currency)
4. **Active Shifts** - Number of currently open shifts
5. **Stock Value** - Current inventory value (KES currency)
6. **Selected Date** - Display date of metrics

### 🎮 Controls

#### Date Selector
- Click the date input field to select a specific date
- Default: Today's date
- All metrics update for the selected date when you refresh

#### Refresh Button
```
[🔄 Refresh] Button
```
- Click to fetch analytics data for the selected date
- Shows "Refreshing..." while loading
- **Data only updates on-demand** (not automatic)
- Last refresh time displays below the header

#### Last Refresh Indicator
Shows when data was last updated:
- "Just now" - Within last minute
- "Xm ago" - Minutes
- "Xh ago" - Hours
- "Xd ago" - Days

## Usage Flow

1. **Open Analytics Tab**
   - Go to Admin Dashboard
   - Click "ANALYTICS" tab at the top

2. **Select Date** (Optional)
   - Click date input to change from today
   - Default shows current date

3. **Click Refresh**
   - View metrics for selected date
   - Check last refresh time

4. **Analyze Metrics**
   - Monitor sales performance
   - Track profits and refunds
   - Check active shift count
   - Monitor stock value

## Performance Notes

✅ **Benefits of On-Demand Refresh:**
- Reduces server load (no constant polling)
- User controls update frequency
- Explicit data refresh for report generation
- Battery efficient for mobile devices

🔧 **Technical Details:**
- Uses JWT token authentication
- Queries: `transactions`, `shifts`, `shift_stock_entries` tables
- Profit calculated at 35% margin (configurable)
- Date format: YYYY-MM-DD

## Troubleshooting

**No Data Shown**
→ Click the "Load Analytics" button or "Refresh" to fetch data

**Shows "Never" for Last Refresh**
→ You haven't clicked refresh yet in this session

**API Error**
→ Check your authentication token is valid
→ Ensure date is valid (format: YYYY-MM-DD)

## Backend Endpoint

```
GET /api/admin/analytics/kpis?date=2026-02-06

Headers:
  Authorization: Bearer {JWT_TOKEN}

Response:
{
  "date": "2026-02-06",
  "totalSales": 45000,
  "profit": 15750,
  "activeShifts": 2,
  "stockValue": 125000,
  "refunds": 2500
}
```

## Notes
- All monetary values in KES (Kenyan Shilling)
- Profit margin can be adjusted in backend code
- Data persists during session (until page refresh)
- Mobile responsive design
- Dark theme optimized for readability
