import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper functions to wrap sqlite3 queries in promises
export const query = {
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

// Initialize database tables
export async function initDb() {
  try {
    // Create Users table
    await query.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        user_image TEXT NOT NULL,
        user_tech_stack TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Posts table
    await query.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_content TEXT NOT NULL,
        topic TEXT DEFAULT 'General',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Migrate posts table if topic column doesn't exist
    try {
      await query.run(`ALTER TABLE posts ADD COLUMN topic TEXT DEFAULT 'General'`);
      console.log('Migrated posts table: Added topic column.');
    } catch (e) {
      // Column already exists, ignore error
    }

    // Create Upvotes table
    await query.run(`
      CREATE TABLE IF NOT EXISTS upvotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Comments table
    await query.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        comment_content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Seed users if empty
    const userCount = await query.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      await query.run(`
        INSERT INTO users (name, user_image, user_tech_stack) 
        VALUES 
        ('Ahmad Raza', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80', 'MERN Stack Developer'),
        ('John Doe', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80', 'Senior DevOps Engineer'),
        ('Jane Smith', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80', 'UI/UX Designer & Frontend Lead')
      `);
      console.log('Database seeded with initial users.');
    }

    // Seed posts if empty
    const postCount = await query.get('SELECT COUNT(*) as count FROM posts');
    if (postCount.count === 0) {
      await query.run(`
        INSERT INTO posts (user_id, post_content, topic)
        VALUES
        (1, 'How do you structure folders in a large scale **React** application with Node.js backend? Any best practices for clean architecture?', 'WebDev'),
        (2, 'What is the best way to deploy a **Vite + Express** app on AWS EC2 with SSL? Do you recommend Nginx or Docker?', 'DevOps'),
        (3, 'Tips for designing a **dark theme** dashboard that reduces eye strain? What contrast ratio do you target for typography?', 'Design')
      `);
      console.log('Database seeded with initial posts.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export default db;
