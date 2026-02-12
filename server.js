const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = {
      users: [],
      watches: [
        { id: 1, model: 'Rolex Submariner 116610LN', brand: 'Rolex', currentPrice: 11200, change1Y: 8.1, change5Y: 34.4, trend: 'up' },
        { id: 2, model: 'Audemars Piguet Royal Oak 15500ST', brand: 'AP', currentPrice: 39200, change1Y: -2.3, change5Y: 27.8, trend: 'flat' },
        { id: 3, model: 'Patek Philippe Nautilus 5711', brand: 'Patek Philippe', currentPrice: 145000, change1Y: 5.7, change5Y: 83.6, trend: 'up' },
        { id: 4, model: 'Omega Speedmaster Moonwatch', brand: 'Omega', currentPrice: 6200, change1Y: 3.2, change5Y: 21.5, trend: 'up' }
      ],
      posts: [
        { id: 1, title: 'Comment repérer une montre à fort potentiel ?', category: 'Analyse', excerpt: 'Rareté, storytelling, historique des prix et profondeur de marché.' },
        { id: 2, title: 'Éviter les faux signaux de valorisation', category: 'Risque', excerpt: 'Ne pas confondre buzz court terme et tendance structurelle.' },
        { id: 3, title: 'Construire une stratégie long terme', category: 'Méthodologie', excerpt: 'Discipline, diversification et gestion émotionnelle.' }
      ],
      transactions: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
  }

  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1e6) {
        req.socket.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
  });
}

function routeApi(req, res, url) {
  const db = readDb();

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'IL-Watch Beta API' });
  }

  if (req.method === 'GET' && url.pathname === '/api/watches') {
    return sendJson(res, 200, db.watches);
  }

  if (req.method === 'GET' && url.pathname === '/api/posts') {
    return sendJson(res, 200, db.posts);
  }

  if (req.method === 'POST' && url.pathname === '/api/register') {
    return parseBody(req)
      .then(body => {
        const { fullName, email, idNumber } = body;
        if (!fullName || !email || !idNumber) {
          return sendJson(res, 400, { error: 'fullName, email et idNumber sont requis.' });
        }

        const newUser = {
          id: db.users.length + 1,
          fullName,
          email,
          idNumberMasked: String(idNumber).slice(-4).padStart(String(idNumber).length, '*'),
          status: 'pending_review',
          createdAt: new Date().toISOString()
        };

        db.users.push(newUser);
        writeDb(db);
        return sendJson(res, 201, { message: 'Inscription reçue, vérification KYC en cours.', user: newUser });
      })
      .catch(err => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === 'POST' && url.pathname === '/api/transactions') {
    return parseBody(req)
      .then(body => {
        const { watchModel, side, amount, country } = body;
        if (!watchModel || !side || !amount || !country) {
          return sendJson(res, 400, { error: 'watchModel, side, amount et country sont requis.' });
        }

        const tx = {
          id: db.transactions.length + 1,
          watchModel,
          side,
          amount: Number(amount),
          country,
          status: 'matching_in_progress',
          createdAt: new Date().toISOString()
        };

        db.transactions.push(tx);
        writeDb(db);
        return sendJson(res, 201, { message: 'Transaction enregistrée. Matching en cours.', transaction: tx });
      })
      .catch(err => sendJson(res, 400, { error: err.message }));
  }

  return sendJson(res, 404, { error: 'Route API introuvable.' });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    default: return 'application/octet-stream';
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/')) {
    return routeApi(req, res, url);
  }

  let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`IL-Watch beta server running on http://localhost:${PORT}`);
});
