const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
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

function findWatch(db, model) {
  return db.watches.find(item => item.model.toLowerCase() === String(model).toLowerCase());
}

function buildPortfolioRows(db, userId) {
  const entries = db.portfolio.filter(item => Number(item.userId) === Number(userId));

  return entries.map(entry => {
    const watch = findWatch(db, entry.model) || { currentPrice: 0, change1Y: 0 };
    const unitPrice = Number(watch.currentPrice);
    const quantity = Number(entry.quantity);
    return {
      id: entry.id,
      model: entry.model,
      quantity,
      unitPrice,
      totalValue: unitPrice * quantity,
      change1Y: watch.change1Y
    };
  });
}

function routeApi(req, res, url) {
  const db = readDb();

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'IL-Watch Beta API' });
  }

  if (req.method === 'GET' && url.pathname === '/api/watches') return sendJson(res, 200, db.watches);
  if (req.method === 'GET' && url.pathname === '/api/posts') return sendJson(res, 200, db.posts);
  if (req.method === 'GET' && url.pathname === '/api/news') return sendJson(res, 200, db.news || []);
  if (req.method === 'GET' && url.pathname === '/api/formations') return sendJson(res, 200, db.formations || []);
  if (req.method === 'GET' && url.pathname === '/api/listings') return sendJson(res, 200, db.listings || []);

  if (req.method === 'GET' && url.pathname === '/api/portfolio') {
    const userId = Number(url.searchParams.get('userId') || 1);
    return sendJson(res, 200, buildPortfolioRows(db, userId));
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
        return sendJson(res, 201, { message: 'Compte créé, KYC en cours de validation.', user: newUser });
      })
      .catch(err => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === 'POST' && url.pathname === '/api/portfolio') {
    return parseBody(req)
      .then(body => {
        const { userId, model, quantity } = body;
        if (!userId || !model || !quantity) {
          return sendJson(res, 400, { error: 'userId, model et quantity sont requis.' });
        }

        const item = {
          id: db.portfolio.length + 1,
          userId: Number(userId),
          model,
          quantity: Number(quantity)
        };

        db.portfolio.push(item);
        writeDb(db);
        return sendJson(res, 201, { message: 'Montre ajoutée au patrimoine.', item });
      })
      .catch(err => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === 'POST' && url.pathname === '/api/listings') {
    return parseBody(req)
      .then(body => {
        const { model, price, condition, seller } = body;
        if (!model || !price || !condition || !seller) {
          return sendJson(res, 400, { error: 'model, price, condition et seller sont requis.' });
        }

        const listing = {
          id: db.listings.length + 1,
          model,
          price: Number(price),
          condition,
          seller
        };

        db.listings.push(listing);
        writeDb(db);
        return sendJson(res, 201, { message: 'Annonce publiée avec succès.', listing });
      })
      .catch(err => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === 'POST' && url.pathname === '/api/ai-assistant') {
    return parseBody(req)
      .then(body => {
        const text = String(body.message || '').toLowerCase();
        if (!text) return sendJson(res, 400, { error: 'message requis.' });

        let answer = 'Analyse standard: comparez prix marché, liquidité et spread avant de décider.';
        if (text.includes('vendre')) answer = 'Pour vendre: vérifiez d’abord la tendance 1 an, puis placez votre annonce proche du prix médian marketplace.';
        if (text.includes('acheter')) answer = 'Pour acheter: priorisez les références liquides, vérifiez l’état complet et utilisez un plafond de prix discipliné.';
        if (text.includes('échange')) answer = 'Pour un échange: comparez la valeur des deux pièces + historique de service + frais import/export.';

        return sendJson(res, 200, { answer });
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

  const filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
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
