import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');
const distPath = path.join(__dirname, 'dist');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDb = data => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

const findWatch = (db, model) => db.watches.find(item => item.model.toLowerCase() === String(model).toLowerCase());

const buildPortfolioRows = (db, userId) => db.portfolio
  .filter(item => Number(item.userId) === Number(userId))
  .map(entry => {
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

app.get('/api/health', (_, res) => res.json({ ok: true, service: 'IL-Watch API (Express)' }));
app.get('/api/watches', (_, res) => res.json(readDb().watches));
app.get('/api/posts', (_, res) => res.json(readDb().posts));
app.get('/api/news', (_, res) => res.json(readDb().news || []));
app.get('/api/formations', (_, res) => res.json(readDb().formations || []));
app.get('/api/listings', (_, res) => res.json(readDb().listings || []));

app.get('/api/account-overview', (req, res) => {
  const userId = Number(req.query.userId || 1);
  const db = readDb();
  const profile = (db.accountProfiles || []).find(item => Number(item.userId) === userId);
  const portfolioRows = buildPortfolioRows(db, userId);
  const computedPortfolioValue = portfolioRows.reduce((acc, row) => acc + row.totalValue, 0);

  res.json({
    userId,
    profile: profile || null,
    computedPortfolioValue,
    watchCount: portfolioRows.length,
    totalUnits: portfolioRows.reduce((acc, row) => acc + row.quantity, 0)
  });
});

app.get('/api/account-activities', (req, res) => {
  const userId = Number(req.query.userId || 1);
  const activities = (readDb().accountActivities || []).filter(item => Number(item.userId) === userId);
  res.json(activities);
});

app.get('/api/portfolio', (req, res) => {
  const userId = Number(req.query.userId || 1);
  res.json(buildPortfolioRows(readDb(), userId));
});

app.post('/api/register', (req, res) => {
  const { fullName, email, idNumber } = req.body || {};
  if (!fullName || !email || !idNumber) {
    return res.status(400).json({ error: 'fullName, email et idNumber sont requis.' });
  }

  const db = readDb();
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
  return res.status(201).json({ message: 'Compte créé, KYC en cours de validation.', user: newUser });
});

app.post('/api/portfolio', (req, res) => {
  const { userId, model, quantity } = req.body || {};
  if (!userId || !model || !quantity) {
    return res.status(400).json({ error: 'userId, model et quantity sont requis.' });
  }

  const db = readDb();
  const item = {
    id: db.portfolio.length + 1,
    userId: Number(userId),
    model,
    quantity: Number(quantity)
  };

  db.portfolio.push(item);
  writeDb(db);
  return res.status(201).json({ message: 'Montre ajoutée au patrimoine.', item });
});

app.post('/api/listings', (req, res) => {
  const { model, price, condition, seller } = req.body || {};
  if (!model || !price || !condition || !seller) {
    return res.status(400).json({ error: 'model, price, condition et seller sont requis.' });
  }

  const db = readDb();
  const listing = {
    id: db.listings.length + 1,
    model,
    price: Number(price),
    condition,
    seller
  };

  db.listings.push(listing);
  writeDb(db);
  return res.status(201).json({ message: 'Annonce publiée avec succès.', listing });
});


app.post('/api/product-requests', (req, res) => {
  const { company, contact, useCase } = req.body || {};
  if (!company || !contact || !useCase) {
    return res.status(400).json({ error: 'company, contact et useCase sont requis.' });
  }

  const db = readDb();
  const productRequest = {
    id: (db.productRequests || []).length + 1,
    company,
    contact,
    useCase,
    status: 'new',
    createdAt: new Date().toISOString()
  };

  db.productRequests = db.productRequests || [];
  db.productRequests.push(productRequest);
  writeDb(db);
  return res.status(201).json({ message: 'Demande reçue. Notre équipe vous contacte rapidement.', request: productRequest });
});
app.post('/api/ai-assistant', (req, res) => {
  const text = String(req.body?.message || '').toLowerCase();
  if (!text) return res.status(400).json({ error: 'message requis.' });

  let answer = 'Analyse standard: comparez prix marché, liquidité et spread avant de décider.';
  if (text.includes('vendre')) answer = 'Pour vendre: vérifiez la tendance 1 an puis publiez proche du prix médian.';
  if (text.includes('acheter')) answer = 'Pour acheter: priorisez les références liquides et fixez un plafond de prix.';
  if (text.includes('échange')) answer = 'Pour un échange: comparez valeur, historique de service et coûts annexes.';

  return res.json({ answer });
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(port, () => {
  console.log(`IL-Watch Express server running on http://localhost:${port}`);
});
