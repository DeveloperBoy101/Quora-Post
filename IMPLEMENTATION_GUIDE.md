# 📚 QuoraTech Project - Implementation Guide

## 🎯 Project Overview

**QuoraTech** ایک **MERN Stack** پر بنا ہوا **Quora-like** سوالات و جوابات کی ایپلیکیشن ہے۔ یہ ایک **Full-Stack Web Application** ہے جہاں صارفین:
- مختلف profiles سے **posts** شیئر کر سکتے ہیں
- دوسرے posts کو **upvote** کر سکتے ہیں  
- posts پر **comments** کر سکتے ہیں
- اپنے posts کو **edit/delete** کر سکتے ہیں

---

## 🏗️ Tech Stack

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (local file-based)
- **CORS** - Cross-origin requests handling
- **Nodemon** - Auto-reload development server

### **Frontend**
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### **Database**
- **SQLite** - Lightweight, file-based database

---

## 📁 Project Structure

```
Quora post/
├── backend/
│   ├── db/
│   │   ├── connection.js      # Database connection & initialization
│   │   └── schema.sql         # SQL schema definitions
│   ├── routes/
│   │   └── posts.js           # All API routes
│   ├── server.js              # Express server setup
│   ├── package.json           # Backend dependencies
│   └── database.sqlite        # SQLite database file
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PostCard.jsx       # Individual post display
│   │   │   ├── PostList.jsx       # List of all posts
│   │   │   ├── QuoraModal.jsx     # Create/Edit post modal
│   │   │   └── CommentsModal.jsx  # View/Add comments modal
│   │   ├── App.jsx            # Main app component
│   │   ├── App.css            # App styles
│   │   ├── index.css          # Global styles
│   │   ├── main.jsx           # React entry point
│   │   └── assets/            # Images/static files
│   ├── public/                # Static public files
│   ├── index.html             # HTML template
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite configuration
```

---

## 🗄️ Database Schema

### **Users Table**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,           -- منفرد شناخت
  name TEXT NOT NULL,               -- صارف کا نام
  user_image TEXT NOT NULL,         -- پروفائل تصویر URL
  user_tech_stack TEXT NOT NULL,    -- تکنیکی مہارت
  created_at DATETIME               -- بنانے کا وقت
)
```

### **Posts Table**
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,         -- کون سے صارف کی post
  post_content TEXT NOT NULL,       -- Post کا مواد
  created_at DATETIME,              -- بنایا گیا وقت
  updated_at DATETIME,              -- آخری تبدیلی
  FOREIGN KEY (user_id) → users(id)
)
```

### **Upvotes Table** 
```sql
CREATE TABLE upvotes (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,         -- کون سی post کو upvote
  user_id INTEGER NOT NULL,         -- کون نے upvote کیا
  created_at DATETIME,
  UNIQUE(post_id, user_id)          -- ایک صارف ایک بار ہی upvote کر سکے
)
```

### **Comments Table**
```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,         -- کون سی post پر comment
  user_id INTEGER NOT NULL,         -- کس نے comment کیا
  comment_content TEXT NOT NULL,    -- Comment کا متن
  created_at DATETIME,
  updated_at DATETIME
)
```

---

## 🔌 API Endpoints

### **Posts API**

| Method | Endpoint | مقصد | Body |
|--------|----------|------|------|
| GET | `/api/posts` | تمام posts حاصل کریں | - |
| POST | `/api/posts` | نیا post بنائیں | `{user_id, post_content}` |
| PUT | `/api/posts/:id` | Post میں ترمیم کریں | `{post_content}` |
| DELETE | `/api/posts/:id` | Post حذف کریں | - |

### **Upvotes API**

| Method | Endpoint | مقصد |
|--------|----------|------|
| GET | `/api/posts/:id/upvotes` | Upvotes کی تعداد |
| POST | `/api/posts/:id/upvotes` | Upvote شامل کریں |
| DELETE | `/api/posts/:id/upvotes/:user_id` | Upvote ہٹائیں |

### **Comments API**

| Method | Endpoint | مقصد |
|--------|----------|------|
| GET | `/api/posts/:id/comments` | Post کے تمام comments |
| POST | `/api/posts/:id/comments` | نیا comment شامل کریں |
| DELETE | `/api/posts/comments/:comment_id` | Comment حذف کریں |

### **Users API**

| Method | Endpoint | مقصد |
|--------|----------|------|
| GET | `/api/posts/users` | تمام صارفین کی فہرست |

---

## 🎨 Frontend Components

### **1. App.jsx** (Main Component)
```javascript
// مقصد: پورے ایپلیکیشن کو manage کریں
// کام:
// - تمام posts حاصل کریں
// - تمام users حاصل کریں
// - Create/Edit/Delete posts کو handle کریں
// - موجودہ صارف کو ٹریک کریں
// - Modal اور notifications manage کریں
```

**اہم State Variables:**
- `posts` - تمام posts کی فہرست
- `users` - تمام صارفین
- `currentUser` - اب کے وقت کا صارف
- `isModalOpen` - Modal کھلا ہے یا نہیں
- `editingPost` - کون سا post edit ہو رہا ہے

### **2. PostList.jsx** (Posts کی فہرست)
```javascript
// مقصد: تمام posts کو display کریں
// Input: posts array, handlers
// Output: PostCard components
```

### **3. PostCard.jsx** (ایک Post کا ڈسپلے)
```javascript
// مقصد: ایک post کو دکھائیں
// Features:
// ✅ صارف کی معلومات (نام، تصویر، مہارت)
// ✅ Post کا مواد اور تاریخ
// ✅ Edit/Delete بٹن
// ✅ Upvote بٹن (تعداد کے ساتھ)
// ✅ Comments بٹن (تعداد کے ساتھ)
```

### **4. QuoraModal.jsx** (Post بنانا/ترمیم کریں)
```javascript
// مقصد: نیا post بنائیں یا موجودہ میں ترمیم کریں
// Features:
// ✅ صارف کو منتخب کریں
// ✅ Post مواد لکھیں
// ✅ Live preview tab
// ✅ Bold text support (**text**)
// ✅ 5000 حروف تک
// ✅ Delete post button (edit mode میں)
```

### **5. CommentsModal.jsx** (Comments دیکھیں/شامل کریں)
```javascript
// مقصد: Post پر comments manage کریں
// Features:
// ✅ تمام comments دیکھیں
// ✅ نیا comment شامل کریں
// ✅ اپنے comments حذف کریں
// ✅ 1000 حروف تک
```

---

## 🚀 Features اور کیسے کام کرتے ہیں

### **1. Create Post** 📝
```
Flow:
1. "Add Post" بٹن دبائیں
2. QuoraModal کھلتا ہے
3. صارف منتخب کریں (dropdown سے)
4. Post لکھیں
5. "Write Post" tab میں دیکھیں یا "Live Preview" میں
6. "Post" بٹن دبائیں
7. Backend کو POST request بھیجی جاتی ہے
8. Database میں post محفوظ ہوتا ہے
9. UI میں فوری طور پر شامل ہوتا ہے
```

### **2. Edit Post** ✏️
```
Flow:
1. Post پر "Edit" icon دبائیں
2. QuoraModal میں post کا ڈیٹا load ہوتا ہے
3. "Edit Post" title دکھتا ہے
4. مواد میں ترمیم کریں
5. "Update" بٹن دبائیں
6. PUT request بھیجی جاتی ہے
7. Database میں update ہوتا ہے
```

### **3. Delete Post** 🗑️
```
Flow:
1. Post پر "Delete" icon دبائیں
2. "Confirm" اور "No" بٹن دکھتے ہیں
3. "Confirm" دبائیں
4. DELETE request بھیجی جاتی ہے
5. Database سے post ہٹایا جاتا ہے
6. UI سے فوری طور پر ہٹتا ہے
```

### **4. Upvote** 👍
```
Flow:
1. Post پر "Upvote" آئکن دبائیں (موجودہ صارف کے طور پر)
2. اگر پہلے upvote نہیں کیا:
   - POST request: /api/posts/:id/upvotes
   - Upvotes table میں entry شامل ہوتی ہے
   - بٹن orange ہو جاتا ہے (filled)
3. اگر پہلے سے upvote کیا ہوا ہے:
   - DELETE request بھیجی جاتی ہے
   - Entry ہٹائی جاتی ہے
   - بٹن واپس normal ہو جاتا ہے
4. تعداد update ہوتی ہے
```

### **5. Comments** 💬
```
Flow:
1. Post پر comment آئکن دبائیں
2. CommentsModal کھلتا ہے
3. موجودہ comments لوڈ ہوتے ہیں
4. نیا comment لکھیں
5. "Post" بٹن دبائیں
6. POST request: /api/posts/:id/comments
7. Comments table میں شامل ہوتا ہے
8. موجودہ comments کی فہرست میں شامل ہوتا ہے
9. اپنے comment کو "Delete" آئکن سے حذف کر سکتے ہیں
```

---

## 🔐 User Switching

**یہ feature testing کے لیے ہے:**
```
1. "Add Post" modal میں "Switch Profile" dropdown دیکھیں
2. مختلف صارفین منتخب کریں
3. ہر صارف سے posts بنا سکتے ہیں
4. Upvotes اور comments کو مختلف صارفین سے کر سکتے ہیں

Database میں 3 پہلے سے موجود صارفین:
- Ahmad Raza (ID: 1) - MERN Stack Developer
- John Doe (ID: 2) - Senior DevOps Engineer  
- Jane Smith (ID: 3) - UI/UX Designer & Frontend Lead
```

---

## 💻 کیسے چلائیں

### **Backend شروع کریں:**
```bash
cd backend
npm install          # پہلی دفعہ
npm run dev          # Development mode
```

### **Frontend شروع کریں:**
```bash
cd frontend
npm install          # پہلی دفعہ
npm run dev          # Development server
```

### **دونوں چل رہے ہوں:**
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173` (یا جو port دکھے)

---

## 🎯 Data Flow

```
User Interface (React)
        ↓
   Event Handler
        ↓
   Fetch API Request
        ↓
Backend (Express Routes)
        ↓
Database Query (SQLite)
        ↓
Response JSON
        ↓
Update Component State
        ↓
UI Re-render
```

### **مثال - Post Create کرتے وقت:**

```javascript
// 1. User "Add Post" دبائے
onClick → openCreateModal()

// 2. Modal میں post لکھے اور "Post" دبائے
onSubmit → handleSubmitPost()

// 3. API request بھیجی جائے
fetch('/api/posts', {
  method: 'POST',
  body: { user_id: 1, post_content: 'میری post' }
})

// 4. Backend میں Express route
router.post('/', validateInput, async (req, res) => {
  // Insert into posts table
  // Return new post
})

// 5. Frontend میں response ملے
setPosts([newPost, ...posts])

// 6. UI update ہو جائے
```

---

## 🛠️ Development Tips

### **Local Testing:**
- مختلف صارفین سے posts بنائیں
- ایک صارف سے post بنائیں، دوسرے سے upvote کریں
- Comments شامل کریں اور حذف کریں
- Browser DevTools میں Network tab دیکھیں

### **Database Query:**
```bash
# SQLite database میں براہ راست دیکھیں
sqlite3 backend/database.sqlite

# اندر:
SELECT * FROM posts;
SELECT * FROM upvotes;
SELECT * FROM comments;
```

### **CSS Customization:**
- `index.css` میں colors define ہیں
- Tailwind CSS استعمال ہو رہی ہے
- `--color-quora-orange` اور `--color-quora-navy` theme colors ہیں

---

## 📊 State Management

**React میں useState استعمال ہو رہا ہے:**

```javascript
// App.jsx میں:
- posts: تمام posts
- users: صارفین کی فہرست
- currentUser: موجودہ صارف
- isModalOpen: modal کی state
- editingPost: کون سا post edit ہو رہا ہے

// PostCard.jsx میں:
- upvoteCount: upvotes کی تعداد
- commentCount: comments کی تعداد
- hasUpvoted: کیا موجودہ صارف نے upvote کیا
- showComments: comments modal کھلا ہے یا نہیں

// CommentsModal.jsx میں:
- comments: تمام comments
- newComment: نیا comment text
- isLoading: API request میں ہے
```

---

## ❌ Error Handling

**مختلف errors handle ہو رہے ہیں:**

```javascript
// Backend میں:
- Input validation (خالی fields، length limits)
- Foreign key validation (user/post موجود ہے یا نہیں)
- Database errors
- Server errors (500)

// Frontend میں:
- Try-catch blocks
- User notifications (success/error messages)
- Loading states
- API error messages دکھائیں
```

---

## 🔄 Real-time Features

- **Live Preview**: Post لکھتے وقت ہی دیکھیں
- **Immediate UI Update**: Create/Edit/Delete کے بعد فوری update
- **Comment Count**: Comments شامل/حذف ہوں تو فوری تعداد update
- **Upvote Toggle**: Upvote/Remove فوری ہو

---

## 📱 Responsive Design

```
📱 Mobile (< 640px):
- Single column layout
- Full width posts
- Stacked sidebar

💻 Tablet (640px - 1024px):
- 2 column grid
- Optimized spacing

🖥️ Desktop (> 1024px):
- 4 column grid (3 for feed, 1 for sidebar)
- Sticky sidebar
- Maximum width: 1792px
```

---

## ✨ Key Technologies Explained

### **Express.js Middleware:**
```javascript
app.use(cors())              // کسی بھی origin سے requests قبول کریں
app.use(express.json())      // JSON body parse کریں
app.use('/api/posts', router) // تمام routes /api/posts سے شروع
```

### **SQLite Foreign Keys:**
```sql
-- جب کوئی user delete ہو تو اس کے posts بھی delete ہوں
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

### **Unique Constraint:**
```sql
-- ایک صارف ایک post کو صرف ایک بار upvote کر سکے
UNIQUE(post_id, user_id)
```

---

## 🎓 سیکھنے والے نکات

1. **Backend API Design**: RESTful endpoints
2. **Database Relationships**: Foreign keys، joins
3. **React Hooks**: useState، useEffect
4. **API Calls**: Fetch API
5. **State Management**: Props drilling، lifting state up
6. **Error Handling**: Try-catch، validation
7. **Responsive Design**: Tailwind CSS، mobile-first
8. **Component Architecture**: Reusable components

---

## 🆘 عام مسائل

| مسئلہ | حل |
|------|-----|
| EADDRINUSE: port 5000 | دوسرا process بند کریں یا port بدلیں |
| SQLITE_ERROR: no such table | Backend restart کریں تاکہ tables بنیں |
| CORS errors | Backend میں CORS middleware ہے |
| Posts نہیں آ رہی | Backend چلا رہا ہے کہ check کریں |
| Comments/Upvotes میں error | صارف/post موجود ہے کہ check کریں |

---

یہ تھا مکمل Implementation Guide! 🎉

کوئی سوال ہو تو پوچھیں! 😊
