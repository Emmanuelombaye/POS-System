# AI Assistant - Deployment & Production Checklist

## Pre-Deployment Verification

### Code Review
- [ ] AdminAIAssistant.tsx created in `src/components/admin/`
- [ ] ModernAdminDashboard.tsx updated with AI import
- [ ] Backend `/api/ai/chat` endpoint implemented
- [ ] OpenAI integration added to server/src/index.ts
- [ ] All imports properly installed (openai package)
- [ ] No TypeScript compilation errors
- [ ] All auth checks in place (JWT + role-based)

### Security Review
- [ ] Frontend: Only admins can see AI chat component
- [ ] Backend: /api/ai/chat requires authentication
- [ ] Backend: /api/ai/chat requires admin role
- [ ] OpenAI API key never exposed to frontend
- [ ] API key stored in environment variables only
- [ ] No secrets committed to version control
- [ ] CORS properly configured

### Database Review
- [ ] All queries use correct table names (from schema)
- [ ] Foreign key relationships properly handled
- [ ] Index queries optimized (7-day window, limits applied)
- [ ] Optional ai_logs table migration created
- [ ] No breaking changes to existing tables

---

## Environment Setup

### Backend Configuration
```
✅ Checklist:
- [ ] OPENAI_API_KEY added to server/.env
- [ ] SUPABASE_URL present in server/.env
- [ ] SUPABASE_KEY present in server/.env
- [ ] JWT_SECRET present in server/.env
- [ ] PORT=4000 set (or preferred port)
- [ ] .env file NOT in version control (.gitignore)
- [ ] .env.example updated with OPENAI_API_KEY
```

### OpenAI Configuration
```
✅ Pre-requisites:
- [ ] Have OpenAI API key (from platform.openai.com)
- [ ] Account has sufficient credits (minimum $5 recommended)
- [ ] API usage limits set in OpenAI dashboard
- [ ] Billing alerts configured (optional)
```

### Frontend Configuration
```
✅ Environment:
- [ ] VITE_API_URL=http://localhost:4000 (development)
- [ ] VITE_API_URL=https://api.yourdomain.com (production)
- [ ] No hardcoded URLs in components
```

---

## Testing Checklist

### Unit Testing
- [ ] AdminAIAssistant component renders without errors
- [ ] Non-admin users cannot see component
- [ ] Admin users can see component
- [ ] Input field accepts text
- [ ] Send button is clickable
- [ ] Loading spinner shows during request
- [ ] Error messages display correctly

### Integration Testing
- [ ] POST /api/ai/chat endpoint responds
- [ ] Authentication middleware works (401 for missing token)
- [ ] Authorization middleware works (403 for non-admin)
- [ ] Database queries return correct data
- [ ] OpenAI API integration works
- [ ] Response displays in chat window
- [ ] Message timestamps are correct

### Functional Testing
```
Test Scenarios:
- [ ] Test 1: "Show low stock items"
      Result: Should list items with quantities
      
- [ ] Test 2: "Cashier discrepancies"
      Result: Should identify variance issues
      
- [ ] Test 3: "Top selling items"
      Result: Should show ranked products
      
- [ ] Test 4: Empty query
      Result: Should show error message
      
- [ ] Test 5: Very long query (100+ chars)
      Result: Should process normally
      
- [ ] Test 6: Special characters in query
      Result: Should handle gracefully
      
- [ ] Test 7: Rapid successive queries
      Result: Should handle queue/concurrency
      
- [ ] Test 8: Network timeout simulation
      Result: Should show timeout error
```

### Performance Testing
- [ ] Chat responds within 10 seconds
- [ ] No memory leaks on repeated queries
- [ ] Frontend remains responsive during API call
- [ ] Multiple admin dashboards can connect
- [ ] API rate limiting works (if configured)

### Security Testing
```
Security Tests:
- [ ] Try accessing /api/ai/chat without token
       Expected: 401 Unauthorized ✓
       
- [ ] Try accessing with invalid token
       Expected: 403 Forbidden ✓
       
- [ ] Try accessing as non-admin user
       Expected: 403 Forbidden ✓
       
- [ ] Try accessing as admin user
       Expected: 200 OK ✓
       
- [ ] Try SQL injection in query
       Expected: Handled gracefully (no DB injection) ✓
       
- [ ] Check OpenAI API key is NOT in network tab
       Expected: Not visible in requests ✓
```

### Mobile Testing
- [ ] Chat window displays on mobile
- [ ] Chat window is responsive (fits screen)
- [ ] Touch interactions work (tap to send)
- [ ] Minimize/maximize works on small screens
- [ ] Message history scrolls correctly
- [ ] Input field shows keyboard

---

## Production Deployment

### Before Going Live

#### 1. Final Code Review
```bash
# Check for console.logs and debugging code
grep -r "console\." src/
grep -r "console\." server/src/

# Check for hardcoded values
grep -r "localhost" src/
grep -r "hardcoded" .

# Security check
grep -r "API_KEY" src/  # Should NOT appear in frontend
grep -r "apiKey" src/   # Should NOT appear in frontend
```

#### 2. Build & Test
```bash
# Frontend build
npm run build
# Check for build errors

# Backend build
cd server
npm run build
# Check for build errors

# Test backend
npm run dev
# Run manual tests

# Test frontend
npm run dev
# Manual UI testing
```

#### 3. Database Preparation
- [ ] Run all database migrations in Supabase
  - [ ] SCRIPT_01_SETUP_FRESH.sql
  - [ ] SCRIPT_02_SETUP_TABLES.sql
  - [ ] SCRIPT_03_STOCK_MANAGEMENT.sql
  - [ ] SCRIPT_04_AI_LOGS.sql (optional)
  
- [ ] Verify all tables exist
- [ ] Verify indexes are created
- [ ] Verify RLS policies are set
- [ ] Back up database before deployment

#### 4. Environment Variables
```bash
# Backend production .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-public-key
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-prod-key
PORT=4000

# Frontend production .env
VITE_API_URL=https://your-backend-api.com
```

#### 5. API Key Security
- [ ] Rotate/renew OpenAI API key
- [ ] Never commit keys to git
- [ ] Store in environment variables only
- [ ] Use different keys for dev/prod
- [ ] Revoke old keys after migration
- [ ] Set API usage limits in OpenAI dashboard

#### 6. Monitoring Setup
- [ ] Application error logging configured
- [ ] Backend health check endpoint working
- [ ] Database connection monitoring
- [ ] OpenAI API error tracking
- [ ] Performance monitoring (optional)
- [ ] User activity logging (optional)

---

## Deployment Steps

### Option 1: Vercel (Recommended)

#### Backend Deployment
```bash
# 1. Create Vercel project
# 2. Connect GitHub repo
# 3. Set environment variables:
SUPABASE_URL=...
SUPABASE_KEY=...
JWT_SECRET=...
OPENAI_API_KEY=...
# 4. Deploy
```

#### Frontend Deployment
```bash
# 1. Update VITE_API_URL to backend URL
# 2. Deploy frontend to Vercel
# 3. Verify API connectivity
```

### Option 2: Docker Deployment

#### Backend Docker
```dockerfile
# server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

#### Run
```bash
docker build -t eden-top-backend .
docker run -e OPENAI_API_KEY=... -p 4000:4000 eden-top-backend
```

### Option 3: Manual VPS Deployment

```bash
# 1. SSH into server
# 2. Clone repo
git clone <repo-url>
cd ceopos

# 3. Setup backend
cd server
npm install
npm run build

# 4. Create .env file
nano .env
# Add all environment variables

# 5. Start with PM2 (process manager)
pm2 start dist/index.js --name "eden-top-api"
pm2 save
pm2 startup

# 6. Setup frontend
cd ..
npm install
npm run build

# 7. Serve with Nginx
# Configure nginx to reverse proxy to backend:4000
# Serve frontend dist/ folder
```

---

## Post-Deployment Verification

### Smoke Tests
```
✅ Checklist:
- [ ] Frontend loads without errors
- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] AI chat window appears
- [ ] Can type message and send
- [ ] AI responds within 10 seconds
- [ ] Response displays correctly
- [ ] No console errors (F12)
- [ ] No network errors (DevTools)
```

### Production Validation
```bash
# Test health endpoint
curl https://api.yourdomain.com/health

# Test AI endpoint (with valid admin JWT)
curl -X POST https://api.yourdomain.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"query":"Test query"}'

# Expected response:
# {"response":"...", "context":{...}}
```

### Monitoring
- [ ] Set up uptime monitoring (StatusPage, Uptime Robot)
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Set up performance monitoring (New Relic, DataDog)
- [ ] Set up log aggregation (CloudWatch, Papertrail)
- [ ] Monitor OpenAI API usage and costs

---

## Rollback Plan

If something goes wrong in production:

```bash
# 1. Immediate: Disable AI endpoint
# - Add flag to skip AI processing
# - Return mock response or error message

# 2. Short-term: Revert backend deployment
git revert <commit-hash>
npm run build
deploy

# 3. Restore from backup
# - Restore database from backup if needed
# - Re-run migrations if necessary

# 4. Notify users
# - Update status page
# - Send notification to admins
# - Document incident

# 5. Root cause analysis
# - Check error logs
# - Check OpenAI API status
# - Review recent changes
# - Post-mortem meeting
```

---

## Ongoing Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check OpenAI API usage
- [ ] Verify backups completed

### Weekly
- [ ] Review performance metrics
- [ ] Check security logs
- [ ] Update dependencies (npm update --save-dev)

### Monthly
- [ ] Review cost analysis
- [ ] Plan feature improvements
- [ ] Security audit
- [ ] Database optimization

### Quarterly
- [ ] Major dependency updates
- [ ] Performance optimization
- [ ] Capacity planning
- [ ] Disaster recovery drill

---

## Documentation

### Required Documents
- [x] AI_QUICK_START.md (5-min setup)
- [x] AI_ASSISTANT_GUIDE.md (Detailed features)
- [x] AI_IMPLEMENTATION_SUMMARY.md (Technical overview)
- [x] AI_ARCHITECTURE_DIAGRAMS.md (System diagrams)
- [x] This deployment checklist

### Optional but Recommended
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Video tutorial for admins
- [ ] Troubleshooting runbook
- [ ] Performance tuning guide
- [ ] Disaster recovery procedure

---

## Team Training

Before launch:

1. **Admin Training (30 mins)**
   - How to access AI assistant
   - Sample queries to try
   - Interpreting responses
   - Taking action on recommendations

2. **Support Team Training (1 hour)**
   - Troubleshooting common issues
   - What each error message means
   - How to help users
   - Escalation procedures

3. **Developer Training (2 hours)**
   - System architecture overview
   - How to debug AI responses
   - How to add new features
   - API documentation

---

## Sign-Off

Production Readiness Checklist:

```
Product Owner Approval:      [ ] Date: ___________
Technical Lead Approval:     [ ] Date: ___________
Security Review Approval:    [ ] Date: ___________
DevOps/Deployment Approval:  [ ] Date: ___________
Legal/Compliance Approval:   [ ] Date: ___________

Approved for Production Deployment: [ ] YES / [ ] NO

Deployment Date: ___________
Deployed By: ___________
Verified By: ___________
```

---

## Emergency Contacts

In case of production issues:

- **Slack Channel:** #ai-assistant-alerts
- **On-Call:** [Person] - [Phone]
- **Escalation:** [Manager] - [Phone]
- **OpenAI Support:** support@openai.com
- **Supabase Support:** support@supabase.com

---

**Last Updated:** February 2026
**Status:** Ready for Deployment
**Version:** 1.0
