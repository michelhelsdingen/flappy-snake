import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';

const app = express();
const PORT = 3001;

// Initialize SQLite database
const dbPath = path.join(__dirname, 'leaderboard.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    avatar TEXT DEFAULT '🐍',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(cors());
app.use(express.json());

// Get leaderboard (top 10)
app.get('/api/leaderboard', (req, res) => {
  const scores = db.prepare(`
    SELECT id, name, score, avatar, created_at
    FROM scores
    ORDER BY score DESC
    LIMIT 10
  `).all();
  res.json(scores);
});

// Add a new score
app.post('/api/scores', (req, res) => {
  const { name, score, avatar = '🐍' } = req.body;

  if (!name || typeof score !== 'number') {
    return res.status(400).json({ error: 'Name and score are required' });
  }

  const stmt = db.prepare('INSERT INTO scores (name, score, avatar) VALUES (?, ?, ?)');
  const result = stmt.run(name, score, avatar);

  // Get the rank of this new score
  const rankResult = db.prepare(`
    SELECT COUNT(*) as rank
    FROM scores
    WHERE score > ?
  `).get(score) as { rank: number };

  const rank = rankResult.rank + 1;

  res.json({
    id: result.lastInsertRowid,
    rank,
    isTopTen: rank <= 10
  });
});

// Get high score
app.get('/api/highscore', (req, res) => {
  const result = db.prepare('SELECT MAX(score) as highScore FROM scores').get() as { highScore: number | null };
  res.json({ highScore: result.highScore || 0 });
});

// Clear all scores (for testing)
app.delete('/api/scores', (req, res) => {
  db.prepare('DELETE FROM scores').run();
  res.json({ message: 'All scores cleared' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Leaderboard API running at http://localhost:${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
});
