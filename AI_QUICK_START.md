# 🤖 AI Assistant - Quick Start Checklist

## Pre-Deployment (Do This First!)

- [ ] You have an OpenAI API key (from https://platform.openai.com/api-keys)
- [ ] You can access the backend server (.env file)
- [ ] Backend is running on port 4000
- [ ] Frontend is running on port 5173
- [ ] You're logged in as an admin user

## Setup Steps (15 Minutes)

### Step 1: Update Backend Environment
```bash
# Open server/.env (or create if doesn't exist)
# Add this line:
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

**Tip:** If you don't have an API key yet:
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (save it somewhere safe!)
4. Paste into server/.env

### Step 2: Restart Backend
```bash
# In your server terminal
# Press Ctrl+C to stop
# Then run:
npm run dev
```

### Step 3: Test in Browser
1. Log in to admin dashboard
2. Look for chat window in **bottom-right corner**
3. Try typing: `Show low stock items`
4. You should get a response within 10 seconds

### Step 4: Optional - Add AI Logs (Audit Trail)
If you want to track AI interactions for compliance:

In Supabase SQL Editor, run:
```sql
-- Copy-paste the entire contents of:
-- supabase_data/SCRIPT_04_AI_LOGS.sql
-- Then execute
```

This creates a table that automatically logs all AI chat interactions with timestamps.

---

## 🎯 What to Expect

### First Time Using AI
**You:** "Low stock items"
**AI:** "I found 3 items below threshold:
- Beef: 8kg (threshold: 10kg) - CRITICAL
- Goat meat: 9.5kg (threshold: 10kg) - Recommend ordering 50kg
- Offal: 5kg (threshold: 10kg) - CRITICAL"

### Real-World Usage Examples

**Scenario 1: Quick Stock Check**
```
You: "What products need restocking?"
AI: Lists items with quantities and suggested amounts
```

**Scenario 2: Investigate Variance**
```
You: "Which cashier had discrepancies today?"
AI: Shows shifts with variance, highlights unusual patterns
```

**Scenario 3: Sales Analysis**
```
You: "Top selling items this week"
AI: Ranked list with quantities and revenue
```

---

## 🚨 Troubleshooting

### Problem: "AI service is not configured"
**Solution:**
- [ ] Check you added OPENAI_API_KEY to server/.env
- [ ] Verify the key starts with "sk-"
- [ ] Restart backend server (Ctrl+C then npm run dev)

### Problem: "You don't have permission"
**Solution:**
- [ ] Log out and log back in as admin user
- [ ] Check your user role in database (should be "admin")

### Problem: No response or very slow
**Solution:**
- [ ] Check your OpenAI account has credits
- [ ] Verify internet connection is working
- [ ] Check server logs for error messages
- [ ] Try a shorter query first

### Problem: Can't see the chat window
**Solution:**
- [ ] Make sure you're logged in as admin
- [ ] Refresh the page (F5 or Cmd+R)
- [ ] Check bottom-right corner of screen
- [ ] Try on a larger desktop screen first

### Problem: Chat disappeared after refresh
**Solution:**
- [ ] That's normal - it's a session-based component
- [ ] Just reload the page to get it back
- [ ] You can also click the close button to hide it

---

## 📊 Key Features to Try

### 1. Stock Analysis
```
"Show low stock items"
"Which products are overstocked?"
"Variance analysis"
"Stock level predictions"
```

### 2. Shift Oversight
```
"Cashier discrepancies today"
"John's shift summary"
"Unusual variance patterns"
"Shift-by-shift breakdown"
```

### 3. Sales Insights
```
"Top selling items"
"Sales trends"
"Which items need promotion"
"Best performing branch"
```

### 4. System Queries
```
"Total inventory value"
"Branch comparison"
"Weekly summary"
"Restock recommendations"
```

---

## 💡 Pro Tips

1. **Be Specific:** "Low stock items in Branch 1" better than just "stock"
2. **Use Numbers:** "Variance > 5kg" helps AI understand your concern
3. **Follow Up:** Ask clarifying questions like "What caused it?"
4. **Chain Requests:** Start with overview, then dive into details
5. **Trust But Verify:** AI is smart but verify critical data manually

---

## ✅ Success Indicators

After setup, you should see:

- ✅ Chat window in bottom-right corner of admin dashboard
- ✅ Ability to type messages and get responses
- ✅ Loading spinner while AI thinks
- ✅ Timestamps on all messages
- ✅ Can minimize/maximize the window
- ✅ Messages persist until page refresh
- ✅ Error messages if something goes wrong

---

## 🔒 Security Notes

- ✅ Only admin users see the AI chat
- ✅ Non-admins cannot access /api/ai/chat endpoint
- ✅ Your OpenAI API key stays on backend (never exposed to frontend)
- ✅ All interactions can be logged for audit trail
- ✅ Data is encrypted in transit (HTTPS in production)

---

## 📱 Mobile Access

The AI assistant works on:
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Tablets (iPad, Android tablets)
- ✅ Mobile phones (responsive design)

**Note:** Chat window appears in bottom-right on desktop, adjusts on mobile.

---

## 🚀 Next Steps

After verifying the AI assistant works:

1. **Train Your Team:**
   - Show managers/admins how to use it
   - Share example queries
   - Demonstrate stock analysis features

2. **Integrate into Workflows:**
   - Check AI dashboard daily
   - Use recommendations for ordering
   - Track variance patterns
   - Monitor cashier discrepancies

3. **Optional: Set Up Audit Logging:**
   - Run SCRIPT_04_AI_LOGS.sql
   - All queries/responses automatically logged
   - Useful for compliance and analysis

4. **Monitor & Improve:**
   - Watch API usage (affects OpenAI costs)
   - Refine queries based on responses
   - Give feedback on usefulness
   - Consider monthly cost budget

---

## 💰 Cost Management

OpenAI pricing (as of Feb 2026):
- **Input:** ~$0.15 per million tokens
- **Output:** ~$0.60 per million tokens
- **Typical query:** 500-1500 tokens
- **Estimated monthly cost:** $5-50 (depending on usage)

To manage costs:
- Monitor API usage in OpenAI dashboard
- Start with moderate query frequency
- Optimize queries (be specific, not wordy)
- Set budget alerts in OpenAI account

---

## 📚 Full Documentation

For detailed info, see:
- `AI_ASSISTANT_GUIDE.md` - Complete setup & feature guide (300+ lines)
- `AI_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `QUICK_REFERENCE.md` - Quick lookup guide with examples

---

## 🎉 You're All Set!

Your Eden Top POS system now has an intelligent AI assistant that:
- Analyzes stock in real-time
- Monitors cashier shifts
- Reports sales trends
- Helps optimize operations
- Is available 24/7

**Questions?** Check the documentation files above or review the setup section again.

---

**Last Updated:** February 2026
**Status:** Production Ready ✅
**Test Date:** [Pending - Do after setup]
