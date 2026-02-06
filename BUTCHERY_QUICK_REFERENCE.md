# ⚡ Butchery Shift Workflow - Quick Reference Card

**📅 Date**: February 4, 2026  
**✅ Status**: LIVE & READY

---

## 🔄 Daily Workflow (1-2-3)

### 1️⃣ **MORNING: Open Shift** ⏰

```
Cashier Login → Shift & Stock Tab → "Open New Shift"
```

**What Happens**:
- ✅ Yesterday's closing → Today's opening (automatic)
- ✅ All meat products initialized (Beef, Goat, Chicken, Liver, Matumbo)
- ✅ POS Terminal unlocked

### 2️⃣ **DURING DAY: Operations** 🛒

**Add Stock** (when delivery arrives):
```
Shift & Stock → "Record Mid-Shift Delivery" → Enter details
```

**Sales** (automatic):
```
POS Terminal → Add to cart → Complete Sale
→ Stock auto-deducts ✅
```

### 3️⃣ **EVENING: Close Shift** 🔒

```
Shift & Stock → "End Shift" → Enter actual counts → Submit
```

**System Calculates**:
- Expected: `Opening + Added - Sold`
- Variance: `Actual - Expected`
- Status: `PENDING_REVIEW` (for admin approval)

---

## 🥩 Tracked Products (5 Categories Only)

| Category | Examples |
|----------|----------|
| 🥩 **Beef** | T-Bone, Ribeye, Ground |
| 🐐 **Goat** | Chops, Ribs |
| 🍗 **Chicken** | Whole, Drumsticks |
| 🫀 **Liver** | Beef/Chicken Liver |
| 🦴 **Matumbo/Offal** | Tripe, Intestines |

---

## 🚫 Business Rules

| Rule | What It Means |
|------|---------------|
| **No Shift = No Sales** | POS blocked until shift opened |
| **Auto-Deduct** | Sales reduce stock instantly |
| **Yesterday's Closing = Today's Opening** | No manual entry needed |
| **All Counts Required** | Must enter actual kg for all 5 products at close |

---

## 👀 Admin View (Real-Time)

**Updates Every**: 10 seconds

**Dashboard Shows**:
```
Product   Opening  +Added  -Sold  Current  Variance
Beef      230kg    +20kg   -35kg  215kg    ✓
Goat       45kg     +0kg   -10kg   35kg    ⚠️ -2kg
```

**Variance Alerts**:
- ✅ **0kg**: Perfect
- ⚠️ **-Xkg**: Deficit (investigate)
- 📦 **+Xkg**: Surplus (check records)

---

## 🔧 Quick Fixes

### "POS Not Working"
→ Check: Shift opened? Go to Shift & Stock tab

### "Stock Not Updating"
→ Wait 10 seconds for real-time sync

### "Opening Stock Wrong"
→ Expected: Uses yesterday's closing. First day uses current stock.

### "Where's Variance?"
→ Only shows after closing shift

---

## 📊 Example Day

| Time | Action | Opening | Added | Sold | Current |
|------|--------|---------|-------|------|---------|
| 8:00 AM | Open Shift | 230kg | 0kg | 0kg | 230kg |
| 10:00 AM | Delivery arrives | 230kg | +20kg | 0kg | 250kg |
| 2:00 PM | 15 sales completed | 230kg | 20kg | -35kg | 215kg |
| 6:00 PM | Close shift (count: 210kg) | 230kg | 20kg | 35kg | **210kg** |
| **Result** | **Variance: -5kg** | Expected: 215kg | Actual: 210kg | **Deficit: 5kg** |

---

## 🎯 One-Line Summary

**Open Shift** → System loads opening stock → **Add deliveries** → Sales auto-deduct → **Close shift** → Enter actual counts → System calculates variance → **Admin sees everything live**

---

## 📱 Quick Access Links

- **Full Workflow Guide**: [BUTCHERY_SHIFT_WORKFLOW.md](BUTCHERY_SHIFT_WORKFLOW.md)
- **Testing Guide**: [LIVE_SYSTEM_VERIFICATION_TEST.md](LIVE_SYSTEM_VERIFICATION_TEST.md)
- **System Architecture**: [SYSTEM_ARCHITECTURE_LIVE.md](SYSTEM_ARCHITECTURE_LIVE.md)

---

**Status**: ✅ READY FOR PRODUCTION USE  
**Next**: Train cashiers + Run test shift
