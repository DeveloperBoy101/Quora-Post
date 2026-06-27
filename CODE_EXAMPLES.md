# 💻 Code Examples & Feature Walkthrough

## 🎯 اہم Features کی Code Examples

---

## 1️⃣ Post بنانا - Complete Flow

### **Frontend: User Input**
```javascript
// QuoraModal.jsx میں
const handleFormSubmit = async (e) => {
  e.preventDefault();
  
  // Validation
  if (!content.trim()) {
    setError('Post content cannot be empty.');
    return;
  }
  
  if (content.length > 5000) {
    setError('Post content cannot exceed 5000 characters.');
    return;
  }
  
  setIsSubmitting(true);
  
  // API call
  try {
    await onSubmit({
      user_id: parseInt(selectedUserId),
      post_content: content
    });
    onClose(); // Modal بند کریں
  } catch (err) {
    setError(err.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

### **Backend: API Handler**
```javascript
// backend/routes/posts.js میں
router.post('/', validatePostInput, async (req, res) => {
  const { user_id, post_content } = req.body;
  
  try {
    // User موجود ہے؟
    const user = await query.get('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!user) {
      return res.status(404).json({ error: `User with ID ${user_id} not found` });
    }

    // Database میں insert کریں
    const result = await query.run(
      'INSERT INTO posts (user_id, post_content) VALUES (?, ?)',
      [user_id, post_content.trim()]
    );

    // نیا post user info کے ساتھ fetch کریں
    const newPost = await query.get(`
      SELECT 
        posts.id, 
        posts.user_id, 
        posts.post_content, 
        posts.created_at, 
        posts.updated_at,
        users.name as user_name, 
        users.user_image, 
        users.user_tech_stack
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

### **Frontend: State Update**
```javascript
// App.jsx میں handleSubmitPost
const handleSubmitPost = async (postData) => {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: postData.user_id,
      post_content: postData.post_content
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to submit post');
  }

  // State میں نیا post شامل کریں
  setPosts(prev => [result.post, ...prev]);
  
  // Notification دکھائیں
  triggerNotification('Post published successfully!');
};
```

---

## 2️⃣ Upvote کریں - Toggle Feature

### **Frontend: Component Logic**
```javascript
// PostCard.jsx میں
const [hasUpvoted, setHasUpvoted] = useState(false);
const [upvoteCount, setUpvoteCount] = useState(0);

// Component mount ہوتے وقت upvotes fetch کریں
useEffect(() => {
  fetchStats();
}, [post.id]);

const fetchStats = async () => {
  try {
    const response = await fetch(`http://localhost:5000/api/posts/${post.id}/upvotes`);
    if (response.ok) {
      const data = await response.json();
      setUpvoteCount(data.upvotes);
    }
  } catch (error) {
    console.error('Error fetching upvotes:', error);
  }
};

// Upvote button handler
const handleUpvote = async () => {
  if (!currentUser) {
    alert('Please select a user profile first');
    return;
  }

  setIsLoadingUpvote(true);
  
  try {
    // اگر پہلے سے upvoted ہے تو DELETE، ورنہ POST
    const endpoint = hasUpvoted
      ? `http://localhost:5000/api/posts/${post.id}/upvotes/${currentUser.id}`
      : `http://localhost:5000/api/posts/${post.id}/upvotes`;

    const method = hasUpvoted ? 'DELETE' : 'POST';
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'POST' ? JSON.stringify({ user_id: currentUser.id }) : undefined
    });

    if (!response.ok) throw new Error('Failed to update upvote');

    const data = await response.json();
    setUpvoteCount(data.upvotes);
    setHasUpvoted(!hasUpvoted);
  } catch (error) {
    console.error('Error updating upvote:', error);
  } finally {
    setIsLoadingUpvote(false);
  }
};

// Render میں button
<button
  onClick={handleUpvote}
  className={`flex items-center gap-1.5 ${hasUpvoted ? 'text-quora-orange' : ''}`}
>
  <ThumbsUp className={hasUpvoted ? 'fill-current' : ''} />
  <span>{upvoteCount}</span>
</button>
```

### **Backend: Upvote Routes**
```javascript
// GET upvotes count
router.get('/:id/upvotes', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query.get(
      'SELECT COUNT(*) as count FROM upvotes WHERE post_id = ?',
      [id]
    );
    res.json({ upvotes: result.count });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST upvote - اگر duplicate ہو تو IGNORE
router.post('/:id/upvotes', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    // INSERT IGNORE = اگر duplicate UNIQUE constraint ہو تو ignore کریں
    await query.run(
      'INSERT IGNORE INTO upvotes (post_id, user_id) VALUES (?, ?)',
      [id, user_id]
    );

    const result = await query.get(
      'SELECT COUNT(*) as count FROM upvotes WHERE post_id = ?',
      [id]
    );

    res.json({ message: 'Upvoted successfully', upvotes: result.count });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE upvote
router.delete('/:id/upvotes/:user_id', async (req, res) => {
  const { id, user_id } = req.params;

  try {
    await query.run(
      'DELETE FROM upvotes WHERE post_id = ? AND user_id = ?',
      [id, user_id]
    );

    const result = await query.get(
      'SELECT COUNT(*) as count FROM upvotes WHERE post_id = ?',
      [id]
    );

    res.json({ message: 'Upvote removed', upvotes: result.count });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

---

## 3️⃣ Comments - Add/Delete/View

### **Frontend: CommentsModal**
```javascript
// CommentsModal.jsx میں

const [comments, setComments] = useState([]);
const [newComment, setNewComment] = useState('');

// Modal کھلتے وقت comments fetch کریں
useEffect(() => {
  if (isOpen && postId) {
    fetchComments();
  }
}, [isOpen, postId]);

const fetchComments = async () => {
  try {
    const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    const data = await response.json();
    setComments(data);
  } catch (err) {
    setError('Failed to load comments');
  }
};

// Comment شامل کریں
const handleAddComment = async (e) => {
  e.preventDefault();
  
  if (!newComment.trim()) {
    setError('Comment cannot be empty');
    return;
  }

  setIsLoading(true);
  try {
    const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        comment_content: newComment
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add comment');
    }

    const result = await response.json();
    // نیا comment list کے اوپر شامل کریں
    setComments([result.comment, ...comments]);
    setNewComment(''); // Input صاف کریں
    setError('');
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

// Comment حذف کریں
const handleDeleteComment = async (commentId) => {
  if (!window.confirm('Delete this comment?')) return;

  try {
    const response = await fetch(`http://localhost:5000/api/posts/comments/${commentId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete comment');

    // State سے remove کریں
    setComments(comments.filter(c => c.id !== commentId));
  } catch (err) {
    setError('Failed to delete comment');
  }
};
```

### **Backend: Comment Routes**
```javascript
// GET تمام comments
router.get('/:id/comments', async (req, res) => {
  const { id } = req.params;

  try {
    const comments = await query.all(`
      SELECT 
        comments.id,
        comments.post_id,
        comments.comment_content,
        comments.created_at,
        comments.updated_at,
        users.name as user_name,
        users.user_image,
        users.id as user_id
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at DESC
    `, [id]);

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST نیا comment
router.post('/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { user_id, comment_content } = req.body;

  // Validation
  if (!comment_content || comment_content.trim() === '') {
    return res.status(400).json({ error: 'comment_content cannot be empty' });
  }

  if (comment_content.length > 1000) {
    return res.status(400).json({ error: 'comment_content cannot exceed 1000 characters' });
  }

  try {
    // Post موجود ہے؟
    const post = await query.get('SELECT id FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Database میں insert
    const result = await query.run(
      'INSERT INTO comments (post_id, user_id, comment_content) VALUES (?, ?, ?)',
      [id, user_id, comment_content.trim()]
    );

    // نیا comment user info کے ساتھ fetch کریں
    const newComment = await query.get(`
      SELECT 
        comments.id,
        comments.post_id,
        comments.comment_content,
        comments.created_at,
        comments.updated_at,
        users.name as user_name,
        users.user_image,
        users.id as user_id
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE comment
router.delete('/comments/:comment_id', async (req, res) => {
  const { comment_id } = req.params;

  try {
    // Comment موجود ہے؟
    const comment = await query.get('SELECT id FROM comments WHERE id = ?', [comment_id]);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await query.run('DELETE FROM comments WHERE id = ?', [comment_id]);

    res.json({ message: 'Comment deleted successfully', deleted_id: comment_id });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

---

## 4️⃣ Database Queries Examples

### **Posts کے ساتھ user info حاصل کریں**
```sql
-- یہ query frontend کو ملتا ہے
SELECT 
  posts.id, 
  posts.user_id, 
  posts.post_content, 
  posts.created_at, 
  posts.updated_at,
  users.name as user_name, 
  users.user_image, 
  users.user_tech_stack
FROM posts
JOIN users ON posts.user_id = users.id
ORDER BY posts.created_at DESC;
```

### **Upvotes کی تعداد**
```sql
SELECT COUNT(*) as count 
FROM upvotes 
WHERE post_id = 1;

-- Result: { count: 5 }
```

### **کسی post کے تمام comments**
```sql
SELECT 
  comments.id,
  comments.post_id,
  comments.comment_content,
  comments.created_at,
  users.name as user_name,
  users.user_image
FROM comments
JOIN users ON comments.user_id = users.id
WHERE comments.post_id = 1
ORDER BY comments.created_at DESC;
```

### **Unique upvote constraint**
```sql
-- ہر (post_id, user_id) combination منفرد ہے
CREATE UNIQUE INDEX UNIQUE(post_id, user_id);

-- تو اگر دوبارہ دیتے ہیں:
INSERT INTO upvotes (post_id, user_id) VALUES (1, 1);
INSERT INTO upvotes (post_id, user_id) VALUES (1, 1); -- ERROR!
```

---

## 5️⃣ Error Handling Examples

### **Frontend: Try-Catch**
```javascript
try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Request failed');
  }

  const result = await response.json();
  // Success handling
  
} catch (error) {
  console.error('Error:', error);
  setError(error.message); // UI میں دکھائیں
  triggerNotification(error.message, 'error');
}
```

### **Backend: Validation**
```javascript
const validatePostInput = (req, res, next) => {
  const { user_id, post_content } = req.body;

  // چیک 1: user_id موجود ہے
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  // چیک 2: post_content موجود ہے
  if (!post_content || post_content.trim() === '') {
    return res.status(400).json({ error: 'post_content cannot be empty' });
  }

  // چیک 3: Length limit
  if (post_content.length > 5000) {
    return res.status(400).json({ error: 'post_content cannot exceed 5000 characters' });
  }

  next(); // ✅ تمام چیکس پاس ہوئیں
};
```

---

## 6️⃣ Live Preview Implementation

### **Post میں **bold** بنانا**
```javascript
// User لکھتا ہے: "**React** is awesome"
// Preview میں دیکھ سکتے ہیں: "React is awesome" (React bold ہے)

const formatPreviewContent = (text) => {
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    // **text** کو search کریں regex سے
    const boldRegex = /\*\*(.*?)\*\*/g;
    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      // Bold سے پہلے کا text
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      // Bold text
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold">
          {match[1]}
        </strong>
      );
      
      lastIndex = boldRegex.lastIndex;
    }

    // آخری حصہ
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <p key={lineIdx} className="mb-2">
        {parts.length > 0 ? parts : ' '}
      </p>
    );
  });
};
```

---

## 7️⃣ Component Props Flow

```
App (State Management)
  ├─ posts: Post[]
  ├─ users: User[]
  ├─ currentUser: User
  │
  └─ passes down:
      ↓
    PostList (Display)
      ├─ posts
      ├─ currentUser
      ├─ users
      │
      └─ maps over posts:
          ↓
        PostCard (Individual Item)
          ├─ post
          ├─ currentUser
          ├─ users
          ├─ onEdit (callback)
          ├─ onDelete (callback)
          │
          └─ renders:
              ├─ CommentsModal
              │   ├─ postId
              │   ├─ currentUser
              │   └─ users
              │
              └─ Upvote Button
                  └─ uses currentUser
```

---

## 🎯 کل کا خلاصہ

| Feature | Frontend | Backend | Database |
|---------|----------|---------|----------|
| **Post Create** | Form input | POST /posts | INSERT |
| **Post View** | PostList component | GET /posts | SELECT JOIN |
| **Post Update** | Edit modal | PUT /posts/:id | UPDATE |
| **Post Delete** | Delete button | DELETE /posts/:id | DELETE |
| **Upvote** | Toggle button | POST/DELETE /upvotes | INSERT/DELETE |
| **Comments** | CommentsModal | POST/DELETE /comments | INSERT/DELETE/SELECT |

---

یہ تھے **اہم code examples**! 🎉

اب آپ سمجھ سکتے ہیں کہ ہر feature کیسے کام کرتی ہے! 🚀
