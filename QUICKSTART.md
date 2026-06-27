# 🚀 QuickStart Guide - جلدی شروع کریں

## 📋 Pre-requisites
- Node.js v18+ installed
- npm یا yarn

---

## ⚡ 30 سیکنڈ میں شروع کریں

### **Step 1: Backend Start کریں**
```bash
cd backend
npm install
npm run dev
```
✅ دیکھیں: `Server is running on http://localhost:5000`

### **Step 2: Frontend Start کریں** (نیا terminal کھولیں)
```bash
cd frontend
npm install
npm run dev
```
✅ دیکھیں: `Local: http://localhost:5173`

### **Step 3: Browser میں کھولیں**
```
http://localhost:5173
```

---

## 🎮 اب کیا کریں؟

### **1️⃣ نیا Post بنائیں**
```
1. "Add Post" بٹن دبائیں
2. موجودہ صارف Ahmad Raza ہے
3. کچھ لکھیں (مثال: "How do you handle state in React?")
4. "Live Preview" tab میں دیکھیں
5. "Post" دبائیں ✅
```

### **2️⃣ مختلف صارف سے Post بنائیں**
```
1. "Add Post" دبائیں
2. "Switch Profile" dropdown میں:
   - John Doe منتخب کریں
   - یا Jane Smith منتخب کریں
3. Post لکھیں
4. "Post" دبائیں
```

### **3️⃣ Upvote کریں**
```
1. کسی post پر "👍 0" دبائیں
2. موجودہ صارف کے طور پر upvote ہوگا
3. آئکن Orange ہو جائے گا
4. دوبارہ دبائیں تو remove ہوگا
```

### **4️⃣ Comment شامل کریں**
```
1. کسی post پر "💬 0" دبائیں
2. CommentsModal کھلے گا
3. Comment لکھیں (مثال: "Great question!")
4. "Post" بٹن دبائیں
5. فوری طور پر شامل ہو جائے گا
```

### **5️⃣ Post Edit کریں**
```
1. اپنے post پر ✏️ icon دبائیں
2. Modal میں "Edit Post" دکھے گا
3. متن میں تبدیلی کریں
4. "Update" بٹن دبائیں
```

### **6️⃣ Post Delete کریں**
```
1. اپنے post پر 🗑️ icon دبائیں
2. "Confirm" اور "No" بٹن دکھیں گے
3. "Confirm" دبائیں تو delete ہوگا
```

---

## 📊 Feature Summary

| Feature | Status | کیسے استعمال |
|---------|--------|-------------|
| **Posts بنانا** | ✅ | "Add Post" بٹن |
| **Posts میں ترمیم** | ✅ | ✏️ آئکن |
| **Posts Delete** | ✅ | 🗑️ آئکن |
| **Upvote** | ✅ | 👍 بٹن |
| **Comments** | ✅ | 💬 بٹن |
| **صارف Switching** | ✅ | Modal میں dropdown |
| **Live Preview** | ✅ | Modal میں tab |
| **Bold Text** | ✅ | `**text**` لکھیں |
| **Responsive** | ✅ | Mobile/Tablet/Desktop |

---

## 🔧 اگر کوئی مسئلہ آئے

### **Port 5000 دوسری ایپلیکیشن سے استعمال ہو رہا ہے**
```bash
# Process kill کریں
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### **Tables بنانے میں خرابی**
```bash
# Backend بند کریں (Ctrl+C)
# دوبارہ Start کریں: npm run dev
```

### **Frontend میں error دکھ رہا ہے**
```bash
# Cache صاف کریں
npm run build
npm run preview
```

---

## 💡 Pro Tips

1. **User Switching**: مختلف صارفین سے testing کریں
2. **Live Preview**: Post کو Live Preview میں چیک کریں
3. **Developer Tools**: F12 دبائیں اور Network tab میں API calls دیکھیں
4. **Bold Text**: `**Your Text Here**` لکھیں post میں
5. **Responsiveness**: Browser کو resize کریں اور mobile view دیکھیں

---

## 📁 اہم Files

```
backend/server.js          ← Express server
backend/db/connection.js   ← Database setup
backend/routes/posts.js    ← تمام API endpoints

frontend/src/App.jsx       ← Main component
frontend/src/components/   ← تمام UI components
```

---

## 🌐 URLs

| URL | مقصد |
|-----|------|
| http://localhost:5000 | Backend server |
| http://localhost:5000/health | Server status check |
| http://localhost:5173 | Frontend app |
| http://localhost:5000/api/posts | تمام posts حاصل کریں |

---

## ✨ اگلے Steps

1. مختلف features کو explore کریں
2. `IMPLEMENTATION_GUIDE.md` پڑھیں تفصیل سے
3. Code میں دیکھیں کہ کیسے کام کرتا ہے
4. React، Express، SQLite سیکھیں

---

Happy Coding! 🎉
