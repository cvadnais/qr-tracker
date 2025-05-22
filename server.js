const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database('./qrcodes.db');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS links (
    code TEXT PRIMARY KEY,
    url TEXT,
    clicks INTEGER DEFAULT 0
  )`);
});

function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}

app.post('/create', async (req, res) => {
  const { url } = req.body;
  const code = generateCode();
  const shortUrl = `${req.protocol}://${req.get('host')}/r/${code}`;

  db.run('INSERT INTO links (code, url) VALUES (?, ?)', [code, url], (err) => {
    if (err) return res.status(500).send('DB error');

    QRCode.toBuffer(shortUrl, { type: 'png' }, (err, buffer) => {
      if (err) return res.status(500).send('QR error');
      res.type('png').send(buffer);
    });
  });
});

app.get('/r/:code', (req, res) => {
  db.get('SELECT url FROM links WHERE code = ?', [req.params.code], (err, row) => {
    if (!row) return res.status(404).send('Not found');

    db.run('UPDATE links SET clicks = clicks + 1 WHERE code = ?', [req.params.code]);
    res.redirect(row.url);
  });
});

app.get('/', (req, res) => {
  res.send('Backend is alive');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

