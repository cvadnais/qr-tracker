// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database('./qrcodes.db');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS links (
    code TEXT PRIMARY KEY,
    url TEXT,
    clicks INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip TEXT
  )`);
});

function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}

// Create QR Code route
app.post('/create', async (req, res) => {
  console.log('Incoming request to /create');
  console.log('Request body:', req.body);

  const { url } = req.body;

  if (!url) {
    console.error('Missing URL');
    return res.status(400).send('URL is required');
  }

  const code = generateCode();
  const shortUrl = `${req.protocol}://${req.get('host')}/r/${code}`;

  db.run('INSERT INTO links (code, url) VALUES (?, ?)', [code, url], (err) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).send('DB error');
    }

    QRCode.toBuffer(shortUrl, { type: 'png' }, (err, buffer) => {
      if (err) {
        console.error('QR generation error:', err.message);
        return res.status(500).send('QR error');
      }
      res.type('png').send(buffer);
    });
  });
});

// Redirect and log click
app.get('/r/:code', (req, res) => {
  const code = req.params.code;

  db.get('SELECT url FROM links WHERE code = ?', [code], (err, row) => {
    if (!row) return res.status(404).send('Not found');

    db.run('UPDATE links SET clicks = clicks + 1 WHERE code = ?', [code]);
    db.run('INSERT INTO clicks (code, user_agent, ip) VALUES (?, ?, ?)', [
      code,
      req.headers['user-agent'],
      req.ip,
    ]);

    res.redirect(row.url);
  });
});

// Stats endpoint
app.get('/stats/:code', (req, res) => {
  db.get('SELECT url, clicks FROM links WHERE code = ?', [req.params.code], (err, row) => {
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Health check
app.get('/', (req, res) => {
  res.send('Backend is alive');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
