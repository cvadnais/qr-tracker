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

const cors = require('cors');
app.use(cors({
  origin: 'https://dx1.dev'
}));


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

      res.json({
        code,
        shortUrl,
        qr: `data:image/png;base64,${buffer.toString('base64')}`
      });
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
    if (!row) {
      return res.status(404).send('<h1>QR Code Not Found</h1>');
    }

    res.send(`
      <html>
        <head>
          <title>QR Stats – ${req.params.code}</title>
          <style>
            body {
              font-family: sans-serif;
              background: #f4f4f4;
              padding: 2rem;
              text-align: center;
            }
            .card {
              background: white;
              padding: 2rem;
              border-radius: 12px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              display: inline-block;
            }
            a {
              color: #007BFF;
              text-decoration: none;
            }
            h1 {
              margin-bottom: 0.5rem;
            }
            p {
              margin: 0.25rem 0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>QR Code Stats</h1>
            <p><strong>Short Code:</strong> ${req.params.code}</p>
            <p><strong>Clicks:</strong> ${row.clicks}</p>
            <p><strong>Destination URL:</strong><br><a href="${row.url}" target="_blank">${row.url}</a></p>
          </div>
        </body>
      </html>
    `);
  });
});


// Health check
app.get('/', (req, res) => {
  res.send('Backend is alive');
});

app.get('/dashboard', (req, res) => {
  db.all('SELECT code, url, clicks FROM links ORDER BY clicks DESC', (err, rows) => {
    if (err) {
      console.error('DB error on /dashboard:', err.message);
      return res.status(500).send('Internal Server Error');
    }

    const rowsHtml = rows.map(row => `
      <tr>
        <td><a href="/r/${row.code}" target="_blank">${row.code}</a></td>
        <td><a href="${row.url}" target="_blank">${row.url}</a></td>
        <td>${row.clicks}</td>
        <td><a href="/stats/${row.code}" target="_blank">View Stats</a></td>
      </tr>
    `).join('');

    res.send(`
      <html>
        <head>
          <title>QR Tracker Dashboard</title>
          <style>
            body {
              font-family: sans-serif;
              background: #f9f9f9;
              padding: 2rem;
            }
            h1 {
              text-align: center;
            }
            table {
              width: 100%;
              max-width: 900px;
              margin: 2rem auto;
              border-collapse: collapse;
              background: white;
              box-shadow: 0 0 8px rgba(0,0,0,0.05);
            }
            th, td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background: #007BFF;
              color: white;
            }
            tr:hover {
              background: #f1f1f1;
            }
            a {
              color: #007BFF;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <h1>QR Tracker Dashboard</h1>
          <table>
            <thead>
              <tr>
                <th>Short Code</th>
                <th>Destination URL</th>
                <th>Clicks</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
