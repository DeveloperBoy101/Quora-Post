import express from 'express';
import { query } from '../db/connection.js';

const router = express.Router();

// ----- Helper: Standard post SELECT fragment (with counts) -----
const postSelectSQL = (userIdParam) => `
  SELECT 
    posts.id, 
    posts.user_id, 
    posts.post_content,
    posts.topic,
    posts.created_at, 
    posts.updated_at,
    users.name as user_name, 
    users.user_image, 
    users.user_tech_stack,
    (SELECT COUNT(*) FROM upvotes WHERE upvotes.post_id = posts.id) as upvote_count,
    (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comment_count
    ${userIdParam ? `, (SELECT COUNT(*) FROM upvotes WHERE upvotes.post_id = posts.id AND upvotes.user_id = ${userIdParam}) as has_upvoted` : ', 0 as has_upvoted'}
  FROM posts
  JOIN users ON posts.user_id = users.id
`;

// ----- Middleware: Validate post input -----
const validatePostInput = (req, res, next) => {
  const { user_id, post_content } = req.body;

  if (req.method === 'POST') {
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    if (isNaN(parseInt(user_id))) return res.status(400).json({ error: 'user_id must be a valid number' });
  }

  if (post_content === undefined || post_content === null) {
    return res.status(400).json({ error: 'post_content is required' });
  }
  if (typeof post_content !== 'string' || post_content.trim() === '') {
    return res.status(400).json({ error: 'post_content cannot be empty' });
  }
  if (post_content.length > 5000) {
    return res.status(400).json({ error: 'post_content cannot exceed 5000 characters' });
  }

  next();
};

/**
 * GET /api/posts
 * Fetch all posts joined with user info, upvote count, comment count, and has_upvoted flag.
 * Query param: ?user_id=<id>
 */
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    const userIdParam = user_id ? parseInt(user_id) : null;
    const posts = await query.all(
      postSelectSQL(userIdParam) + ' ORDER BY posts.created_at DESC'
    );
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * GET /api/posts/users
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await query.all('SELECT id, name, user_image, user_tech_stack FROM users ORDER BY id ASC');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/posts/users
 * Create a new user profile
 */
router.post('/users', async (req, res) => {
  const { name, user_image, user_tech_stack } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (!user_tech_stack || !user_tech_stack.trim()) return res.status(400).json({ error: 'user_tech_stack is required' });

  const imageUrl = user_image?.trim() ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=ea580c&color=fff&size=256`;

  try {
    const result = await query.run(
      'INSERT INTO users (name, user_image, user_tech_stack) VALUES (?, ?, ?)',
      [name.trim(), imageUrl, user_tech_stack.trim()]
    );
    const newUser = await query.get('SELECT id, name, user_image, user_tech_stack FROM users WHERE id = ?', [result.id]);
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', validatePostInput, async (req, res) => {
  const { user_id, post_content, topic = 'General' } = req.body;
  try {
    const user = await query.get('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ error: `User with ID ${user_id} not found` });

    const result = await query.run(
      'INSERT INTO posts (user_id, post_content, topic) VALUES (?, ?, ?)',
      [user_id, post_content.trim(), topic]
    );

    const newPost = await query.get(
      postSelectSQL(user_id) + ' WHERE posts.id = ?',
      [result.id]
    );

    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * PUT /api/posts/:id
 * Update an existing post
 */
router.put('/:id', validatePostInput, async (req, res) => {
  const { id } = req.params;
  const { post_content, topic, user_id } = req.body;

  try {
    const post = await query.get('SELECT id, user_id FROM posts WHERE id = ?', [id]);
    if (!post) return res.status(404).json({ error: `Post with ID ${id} not found` });

    const topicClause = topic ? ', topic = ?' : '';
    const params = topic
      ? [post_content.trim(), topic, id]
      : [post_content.trim(), id];

    await query.run(
      `UPDATE posts SET post_content = ?, updated_at = CURRENT_TIMESTAMP${topicClause} WHERE id = ?`,
      params
    );

    const updatedPost = await query.get(
      postSelectSQL(user_id || null) + ' WHERE posts.id = ?',
      [id]
    );

    res.json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a post
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await query.get('SELECT id FROM posts WHERE id = ?', [id]);
    if (!post) return res.status(404).json({ error: `Post with ID ${id} not found` });

    await query.run('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ message: 'Post deleted successfully', deleted_id: id });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * GET /api/posts/:id/upvotes
 * Get upvote count for a post
 */
router.get('/:id/upvotes', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query.get('SELECT COUNT(*) as count FROM upvotes WHERE post_id = ?', [id]);
    res.json({ upvotes: result.count });
  } catch (error) {
    console.error('Error fetching upvotes:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/posts/:id/upvotes
 * Add an upvote to a post (SQLite: INSERT OR IGNORE)
 */
router.post('/:id/upvotes', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  try {
    const post = await query.get('SELECT id FROM posts WHERE id = ?', [id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // SQLite-compatible: INSERT OR IGNORE (not MySQL's INSERT IGNORE)
    await query.run('INSERT OR IGNORE INTO upvotes (post_id, user_id) VALUES (?, ?)', [id, user_id]);

    const result = await query.get('SELECT COUNT(*) as count FROM upvotes WHERE post_id = ?', [id]);
    res.json({ message: 'Upvoted successfully', upvotes: result.count });
  } catch (error) {
    console.error('Error adding upvote:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/posts/:id/upvotes/:user_id
 * Remove an upvote from a post
 */
router.delete('/:id/upvotes/:user_id', async (req, res) => {
  const { id, user_id } = req.params;
  try {
    await query.run('DELETE FROM upvotes WHERE post_id = ? AND user_id = ?', [id, user_id]);
    const result = await query.get('SELECT COUNT(*) as count FROM upvotes WHERE post_id = ?', [id]);
    res.json({ message: 'Upvote removed', upvotes: result.count });
  } catch (error) {
    console.error('Error removing upvote:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/posts/:id/comments
 * Get all comments for a post
 */
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
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/posts/:id/comments
 * Add a comment to a post
 */
router.post('/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { user_id, comment_content } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  if (!comment_content || typeof comment_content !== 'string' || comment_content.trim() === '') {
    return res.status(400).json({ error: 'comment_content cannot be empty' });
  }
  if (comment_content.length > 1000) {
    return res.status(400).json({ error: 'comment_content cannot exceed 1000 characters' });
  }

  try {
    const post = await query.get('SELECT id FROM posts WHERE id = ?', [id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const user = await query.get('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await query.run(
      'INSERT INTO comments (post_id, user_id, comment_content) VALUES (?, ?, ?)',
      [id, user_id, comment_content.trim()]
    );

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

    res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/posts/comments/:comment_id
 * Delete a comment
 */
router.delete('/comments/:comment_id', async (req, res) => {
  const { comment_id } = req.params;
  try {
    const comment = await query.get('SELECT id FROM comments WHERE id = ?', [comment_id]);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    await query.run('DELETE FROM comments WHERE id = ?', [comment_id]);
    res.json({ message: 'Comment deleted successfully', deleted_id: comment_id });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
