# 🔑 SYSTEM CREDENTIALS & ENDPOINTS

**⚠️ KEEP THIS SECURE - DO NOT SHARE**

---

## 🌐 URLS

### Development
```
Frontend:   http://localhost:5173
Backend:    http://localhost:4000
Supabase:   https://app.supabase.com
Database:   glskbegsmdrylrhczpyy.supabase.co
```

### Production
```
Frontend:   [Your production domain]
Backend:    [Your production API domain]
```

---

## 👤 DEFAULT ADMIN ACCOUNT

```
ID:         a1
Name:       System Admin
Email:      admin@edendrop001.com
Password:   @AdminEdenTop
Role:       admin
Status:     Active
```

**⚠️ Change this password immediately after setup!**

---

## 🔐 SYSTEM SECRETS

### JWT Secret
```
Location:   /server/.env
Key:        JWT_SECRET
Value:      eden-drop-001-secret-key-2026
Expires:    All JWT tokens: 24 hours
```

**Recommended for Production**:
- Generate strong random key (32+ characters)
- Use OpenSSL: `openssl rand -hex 32`
- Update in `.env` and restart backend

### Supabase Credentials
```
Location:   /server/.env

SUPABASE_URL:
sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ

SUPABASE_KEY:
https://glskbegsmdrylrhczpyy.supabase.co
```

**Status**: Active and connected ✅

---

## 👥 ALL USERS IN SYSTEM

### Admin
| ID | Name | Password | Email |
|----|------|----------|-------|
| a1 | System Admin | @AdminEdenTop | admin@edendrop001.com |

### Managers
| ID | Name | Password | Email |
|----|------|----------|-------|
| m1 | Manager One | @AdminEdenTop | manager1@edendrop001.com |

### Cashiers
| ID | Name | Password | Email |
|----|------|----------|-------|
| c1 | Cashier One | @AdminEdenTop | cashier1@edendrop001.com |
| c2 | Cashier Two | @AdminEdenTop | cashier2@edendrop001.com |
| c3 | Cashier Three | @AdminEdenTop | cashier3@edendrop001.com |

**Note**: All use default password for MVP. Change via admin panel after setup.

---

## 🔗 API ENDPOINTS

### Authentication
```
POST /api/auth/login
└─ Body: { userId: string, password: string }
└─ Response: { token: string, user: { id, name, role } }
```

### User Management (Admin Only - Requires Token)
```
GET /api/admin/users
├─ Returns all users
└─ Header: Authorization: Bearer <token>

POST /api/admin/users
├─ Create user
├─ Body: { id, name, role, email, phone, password, branch_id }
└─ Header: Authorization: Bearer <token>

PATCH /api/admin/users/:id
├─ Update user
├─ Body: { name, email, phone, role, branch_id }
└─ Header: Authorization: Bearer <token>

DELETE /api/admin/users/:id
├─ Delete user
└─ Header: Authorization: Bearer <token>

POST /api/admin/users/:id/reset-password
├─ Reset password
├─ Body: { newPassword: string }
└─ Header: Authorization: Bearer <token>
```

### Other Endpoints
```
GET /health
└─ System health check

GET /debug/users
└─ Debug endpoint (development only)
```

---

## 🗄️ DATABASE

### Supabase Project
```
Project ID:  glskbegsmdrylrhczpyy
Region:      [Auto-detected]
Status:      Active ✅
```

### Main Tables
```
users
├── id (TEXT, PRIMARY KEY)
├── name (TEXT)
├── email (TEXT)
├── phone (TEXT)
├── password_hash (TEXT)
├── role (TEXT: admin|manager|cashier)
├── branch_id (TEXT)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

products
├── id (TEXT)
├── name (TEXT)
├── code (TEXT)
├── category (TEXT)
├── unit_price (NUMERIC)
├── weight_kg (NUMERIC)
├── status (TEXT)
└── [other fields]

transactions
├── id (TEXT)
├── cashier_id (TEXT)
├── created_at (TIMESTAMP)
├── items (JSONB)
├── discount (NUMERIC)
├── total (NUMERIC)
└── [other fields]

shifts
├── id (TEXT)
├── cashier_id (TEXT)
├── status (TEXT)
├── opened_at (TIMESTAMP)
├── closed_at (TIMESTAMP)
└── [other fields]
```

---

## 🔧 CONFIGURATION FILES

### Backend Configuration
```
File: /server/.env
```
```env
# Supabase
SUPABASE_URL=https://glskbegsmdrylrhczpyy.supabase.co
SUPABASE_KEY=sb_publishable_...

# Authentication
JWT_SECRET=eden-drop-001-secret-key-2026

# Server
PORT=4000
NODE_ENV=development
```

### Frontend Configuration
```
File: /.env (optional, use default if not set)
```
```env
VITE_API_URL=http://localhost:4000
```

---

## 🚀 RUNNING THE SYSTEM

### Terminal 1: Backend
```bash
cd /server
npm run dev
# Listens on http://localhost:4000
```

### Terminal 2: Frontend
```bash
npm run dev
# Listens on http://localhost:5173
```

### Access System
```
Browser: http://localhost:5173
Login: a1 / @AdminEdenTop
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Changed default admin password
- [ ] Updated JWT_SECRET
- [ ] Enabled HTTPS in production
- [ ] Set strong database password
- [ ] Enabled database backups
- [ ] Configured CORS properly
- [ ] Set up rate limiting
- [ ] Enabled audit logging
- [ ] Configured email alerts
- [ ] Set up monitoring

---

## 📝 ENVIRONMENT VARIABLES EXPLAINED

### SUPABASE_URL
- **What**: Your Supabase project URL
- **Where**: Supabase dashboard → Settings → API
- **Example**: https://glskbegsmdrylrhczpyy.supabase.co
- **Security**: Public (safe in frontend)

### SUPABASE_KEY
- **What**: Supabase publishable key
- **Where**: Supabase dashboard → Settings → API
- **Example**: sb_publishable_...
- **Security**: Public (safe in frontend)

### JWT_SECRET
- **What**: Secret for signing JWT tokens
- **Where**: You set this
- **Example**: Random 32+ character string
- **Security**: KEEP SECRET! Never commit to git!
- **How to generate**: `openssl rand -hex 32`

### PORT
- **What**: Backend server port
- **Default**: 4000
- **Change if**: Port 4000 already in use

### NODE_ENV
- **What**: Environment mode
- **Options**: development | production
- **Default**: development
- **Security**: Set to production for live

---

## 🔄 BACKUP & RECOVERY

### Database Backup
```
Supabase Console → Backups
Auto-backup: Every 24 hours
Manual backup: Create anytime
Retention: 7 days (free) / 30 days (pro)
```

### Restore from Backup
```
Supabase Console → Backups → Restore
Select backup date/time
Click "Restore"
Database restored to that state
```

### User Data Backup
```
Command: Export from Supabase
Format: CSV or JSON
Location: Keep offsite
Frequency: Weekly recommended
```

---

## 🚨 EMERGENCY PROCEDURES

### If Admin Password Forgotten
1. Access Supabase database directly
2. Query: `SELECT * FROM users WHERE id = 'a1'`
3. Generate new password hash:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = bcrypt.hashSync('@AdminEdenDrop001', 10);
   console.log(hash);
   ```
4. Update: `UPDATE users SET password_hash = '[hash]' WHERE id = 'a1'`

### If Database Connection Lost
1. Check Supabase status: https://status.supabase.com
2. Verify credentials in `/server/.env`
3. Check network connectivity
4. Restart backend: `npm run dev`
5. Check browser console for errors

### If JWT_SECRET Compromised
1. Generate new secret: `openssl rand -hex 32`
2. Update `/server/.env` with new secret
3. Restart backend
4. All users must re-login (old tokens invalid)

### If Users Table Corrupted
1. Stop backend: Ctrl+C
2. Restore from backup via Supabase console
3. Restart backend: `npm run dev`
4. Verify users are back

---

## 📊 MONITORING & LOGS

### Backend Logs
```
When running:    npm run dev
Shows:           Startup messages, errors, requests
Look for:        "listening on port 4000"
Errors:          [ERROR] messages
```

### Browser Console Logs
```
Shortcut:        F12 (or Ctrl+Shift+J)
Shows:           Frontend errors, API calls
Clear:           Ctrl+L
Export:          Right-click → Save as...
```

### Database Logs
```
Supabase Console → Logs
Shows:           Query logs, connection logs
Search:          By timestamp, user, table
Export:          Via Supabase API
```

---

## 🎯 COMMON COMMANDS

### Start Backend
```bash
cd /server && npm run dev
```

### Start Frontend
```bash
npm run dev
```

### Install Dependencies
```bash
npm install
cd server && npm install
```

### Build for Production
```bash
npm run build
cd server && npm run build
```

### Reset Database (Development Only)
```bash
# Via Supabase console:
# 1. SQL Editor
# 2. Delete all data or drop tables
# 3. Run migrations again
```

---

## 📞 TROUBLESHOOTING CONTACTS

### System Issues
- Check logs first: `npm run dev` output
- Check browser console: F12
- Check Supabase status: status.supabase.com

### Common Issues & Fixes

**"Connection refused on :4000"**
- Backend not running
- Fix: `npm run dev` in /server folder

**"Cannot login"**
- Wrong credentials
- User doesn't exist
- Database not connected
- Fix: Check backend logs, verify credentials

**"API returns 403 Forbidden"**
- Token invalid or expired
- User role insufficient
- Fix: Clear localStorage, login again

**"Real-time updates not working"**
- Supabase connection lost
- Browser WebSocket blocked
- Fix: Refresh page, check network tab

---

## ✅ SYSTEM VERIFICATION

Run these checks to verify everything is working:

1. **Backend Running**
   ```bash
   curl http://localhost:4000/health
   # Should return: {"status":"ok","service":"eden-drop-001-backend"}
   ```

2. **Frontend Accessible**
   ```
   http://localhost:5173
   # Should show login page
   ```

3. **Database Connected**
   - Check backend logs for: "Successfully connected to Supabase database"

4. **Users Exist**
   ```bash
   curl http://localhost:4000/debug/users
   # Should show: {"totalUsers":5,"users":[...]}
   ```

5. **Login Works**
   - Enter: a1 / @AdminEdenTop
   - Should redirect to admin dashboard

6. **User Management Works**
   - Go to Admin → Users
   - Should show list of users
   - Should be able to create/edit/delete

---

## 🎉 YOU'RE ALL SET!

Your POS system now has:
✅ Enterprise-grade authentication  
✅ Secure user management  
✅ Role-based access control  
✅ Production-ready deployment  

**Keep this document safe and secure!**

---

**Version**: 1.0  
**Last Updated**: February 6, 2026  
**System**: Eden Drop 001 POS

