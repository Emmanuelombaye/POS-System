# ============================================================================
# AI ASSISTANT SETUP GUIDE
# ============================================================================

## Overview
The Admin AI Assistant is an intelligent tool integrated into the Eden Top POS system that provides:
- Real-time stock analysis and low-stock alerts
- Cashier shift oversight and variance detection
- Sales insights and trend analysis
- System-wide recommendations

## Features

### 1. Stock & Inventory Analysis
- Identifies low-stock items and suggests replenishment quantities
- Analyzes stock variances (expected vs. actual)
- Flags potential losses or counting errors
- Recommends optimal stock levels per product

**Sample Queries:**
- "Show low stock items in Branch 1"
- "Which products are overstocked?"
- "What's the variance trend this week?"

### 2. Shift & Cashier Oversight
- Summarizes cashier shifts (opening, added, sold, closing stock)
- Detects discrepancies between expected and actual stock
- Flags suspicious patterns (unusual variances, unexplained losses)

**Sample Queries:**
- "Which cashier has discrepancies today?"
- "Show me shift summaries for John"
- "Any variance issues this week?"

### 3. Sales & Reports
- Shows top-selling items per branch
- Analyzes sales trends over time
- Suggests promotions for slow-moving items
- Generates daily, weekly, monthly reports

**Sample Queries:**
- "What were our top-selling items this week?"
- "Which branch had the highest sales?"
- "Suggest promotions for slow items"

### 4. System Assistance
- Answers general POS system queries
- Provides quick insights without manual analysis
- Helps optimize operations and reduce losses

## Setup Instructions

### Backend Setup

#### 1. Install Dependencies
```bash
cd server
npm install openai
```

#### 2. Configure OpenAI API Key
Add to your `.env` file in the `server` directory:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

To get your OpenAI API key:
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy and paste into your .env file

#### 3. Create AI Logs Table (Optional but Recommended)
Run the migration in Supabase SQL Editor:
```sql
-- Execute SCRIPT_04_AI_LOGS.sql from supabase_data/ folder
```

This creates an audit trail of all AI interactions for compliance and analysis.

### Frontend Setup
No additional setup required - the AI Assistant is automatically integrated into the admin dashboard and only visible to admin users.

## Usage

### Accessing the AI Assistant
1. Log in as an admin user
2. Navigate to the Admin Dashboard
3. You'll see the AI Assistant chat window in the bottom-right corner

### Asking Questions
- Click on the chat input field
- Type your query in plain English
- The AI analyzes current system data and responds with actionable insights
- Messages are timestamped for easy reference

### Minimize/Maximize
- Use the minimize button to collapse the chat window
- Use the maximize button to expand it again
- Use the close button to hide the assistant (can reopen by refreshing)

### Sample Workflows

#### Workflow 1: Daily Stock Check
1. Ask: "Show low stock items"
2. AI responds with items below threshold
3. Review recommendations for replenishment
4. Use insights to place orders

#### Workflow 2: Investigate Variance
1. Ask: "Which cashier has discrepancies?"
2. AI identifies shifts with variance > 0.1kg
3. Review the specific products and amounts
4. Follow up with individual cashiers if needed

#### Workflow 3: Sales Analysis
1. Ask: "What were top-selling items?"
2. AI shows products by sales volume
3. Review trends and performance
4. Plan promotions or adjustments

## Technical Details

### API Endpoint
- **URL:** `POST /api/ai/chat`
- **Auth:** Bearer token required (admin only)
- **Request Body:**
```json
{
  "query": "Your question here"
}
```

- **Response:**
```json
{
  "response": "AI assistant's detailed response",
  "context": {
    "lowStockCount": 5,
    "discrepancyCount": 2,
    "topSellingItems": [["Beef", {...}], ["Goat", {...}]]
  }
}
```

### Context Gathering
The AI assistant automatically gathers:
- **Products:** All active products with current stock levels
- **Shifts:** Last 7 days of shift stock entries
- **Transactions:** Last 7 days of sales transactions
- **Variances:** Shifts with discrepancies > 0.1kg
- **Top Items:** Best-selling products by quantity

### System Prompt
The AI is configured with a role-based system prompt that makes it:
- Focused on POS system optimization
- Data-driven with specific metrics
- Proactive in identifying risks (losses, discrepancies)
- Actionable (suggesting specific quantities, corrective actions)

### Authentication & Authorization
- Only admin users can access the AI Assistant
- Non-admin users cannot see the chat component
- The backend endpoint enforces role-based access control
- Returns 403 Forbidden for unauthorized access

## Database Tables Used

### Products Table
- Fetches: id, name, price, stock_kg, low_stock_threshold_kg

### Shift Stock Entries Table
- Fetches: shift details, opening/added/sold/closing stock, variance
- Timeframe: Last 7 days
- Relationships: Includes product and cashier info

### Transactions Table
- Fetches: sales data, product, quantity, price
- Timeframe: Last 7 days
- Used for: Sales analysis, top-item identification

### AI Logs Table (Optional)
- Stores: admin_id, query, response, timestamp
- Used for: Audit trail, compliance, usage analytics

## Troubleshooting

### Issue: "AI service is not configured"
**Solution:** Add `OPENAI_API_KEY` to your `.env` file and restart the backend server.

### Issue: "You don't have permission to use the AI assistant"
**Solution:** Only admin users can access the AI Assistant. Check your user role in the database.

### Issue: No AI response / Timeout
**Solution:** 
- Check your internet connection
- Verify OpenAI API key is valid
- Check OpenAI account has sufficient credits
- Review server logs for detailed errors

### Issue: AI responses are generic or unhelpful
**Solution:**
- Be more specific in your queries
- Use system metric names (e.g., "variance", "low stock", "discrepancy")
- Include branch or product names when relevant
- Review the AI prompt in the backend code for context understanding

## Best Practices

1. **Regular Checks:** Review AI insights daily during shift openings
2. **Follow-up Actions:** Use AI recommendations as starting points, verify with manual checks
3. **Variance Investigation:** Don't ignore variance alerts - always investigate discrepancies
4. **Data Quality:** Ensure accurate opening/closing counts for reliable variance analysis
5. **Trend Analysis:** Look for patterns over time, not just individual outliers

## Optional Enhancements

### 1. Export Reports
Add functionality to export AI-generated reports to PDF/Excel for record-keeping.

### 2. Predictive Analytics
Use historical data to predict stock needs and sales trends.

### 3. Custom Alerts
Configure specific thresholds and automatic alerts for different metrics.

### 4. Multi-branch Analysis
Compare performance across branches and identify best practices.

### 5. Scheduled Reports
Set up automated daily/weekly reports sent to admins via email.

## Support & Feedback

For issues or feature requests:
1. Check the troubleshooting section above
2. Review server logs: `npm run dev` in the server directory
3. Verify OpenAI API key and account status
4. Check database connectivity via `/debug/users` endpoint

---

**Last Updated:** February 2026
**Version:** 1.0
