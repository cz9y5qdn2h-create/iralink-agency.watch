import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

const BLOCK_TIME_MS = 1200;
const MAX_TX_PER_BLOCK = 400;
const MAX_MEMPOOL_SIZE = 8000;
const VALIDATORS = Object.freeze(['eralink-node-a', 'eralink-node-b', 'eralink-node-c']);
const chainState = {
  chainId: 'eralink-watch-mainnet',
  blocks: [],
  mempool: [],
  txByHash: new Map(),
  processedTx: 0,
  startedAt: Date.now(),
  validatorIndex: 0
};

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

const buildBlockHash = ({ index, previousHash, timestamp, validator, txRoot }) => (
  sha256(`${index}|${previousHash}|${timestamp}|${validator}|${txRoot}`)
);

const buildMerkleLikeRoot = txs => {
  if (!txs.length) return sha256('empty');
  return sha256(txs.map(tx => tx.hash).join('|'));
};

const appendBlock = transactions => {
  const previous = chainState.blocks[chainState.blocks.length - 1];
  const index = chainState.blocks.length;
  const timestamp = Date.now();
  const validator = VALIDATORS[chainState.validatorIndex % VALIDATORS.length];
  const txRoot = buildMerkleLikeRoot(transactions);
  const previousHash = previous ? previous.hash : 'GENESIS';
  const hash = buildBlockHash({ index, previousHash, timestamp, validator, txRoot });

  const block = {
    index,
    previousHash,
    hash,
    timestamp,
    validator,
    txCount: transactions.length,
    txRoot,
    transactions
  };

  chainState.blocks.push(block);
  chainState.validatorIndex += 1;
  chainState.processedTx += transactions.length;
  return block;
};

const normalizePayloadSize = payload => Buffer.byteLength(JSON.stringify(payload || {}), 'utf8');

const createTransaction = ({ type, assetId, ownerId, metadata }) => {
  const timestamp = Date.now();
  const txPayload = {
    type: String(type || 'asset_event'),
    assetId: String(assetId || 'unknown_asset'),
    ownerId: String(ownerId || 'unknown_owner'),
    metadata: metadata || {}
  };

  const payloadSize = normalizePayloadSize(txPayload.metadata);
  const nonce = crypto.randomUUID();
  const hash = sha256(`${timestamp}|${nonce}|${JSON.stringify(txPayload)}`);

  return {
    hash,
    timestamp,
    nonce,
    payloadSize,
    ...txPayload
  };
};

const queueTransaction = tx => {
  if (chainState.mempool.length >= MAX_MEMPOOL_SIZE) {
    return { ok: false, error: 'Mempool saturé, réessayez dans quelques secondes.' };
  }

  chainState.mempool.push(tx);
  chainState.txByHash.set(tx.hash, { status: 'queued', tx });
  return { ok: true };
};

appendBlock([
  createTransaction({
    type: 'network_bootstrap',
    assetId: 'system',
    ownerId: 'eralink-agency',
    metadata: { message: 'Genesis block ready' }
  })
]);

setInterval(() => {
  if (!chainState.mempool.length) return;
  const batch = chainState.mempool.splice(0, MAX_TX_PER_BLOCK);
  const block = appendBlock(batch);
  batch.forEach(tx => chainState.txByHash.set(tx.hash, { status: 'confirmed', blockIndex: block.index, tx }));
}, BLOCK_TIME_MS);

const getBlockchainStats = () => {
  const uptimeMs = Date.now() - chainState.startedAt;
  const tps = uptimeMs > 0 ? (chainState.processedTx / (uptimeMs / 1000)) : 0;
  const latestBlock = chainState.blocks[chainState.blocks.length - 1];

  return {
    chainId: chainState.chainId,
    status: 'ready',
    consensus: 'Proof of Authority (fast-finality)',
    validators: VALIDATORS.length,
    blockHeight: chainState.blocks.length - 1,
    latestBlockHash: latestBlock?.hash || null,
    latestBlockAt: latestBlock?.timestamp || null,
    mempoolSize: chainState.mempool.length,
    processedTx: chainState.processedTx,
    estimatedTps: Number(tps.toFixed(2)),
    blockTimeMs: BLOCK_TIME_MS,
    maxTxPerBlock: MAX_TX_PER_BLOCK,
    capacityPerSecond: Number(((MAX_TX_PER_BLOCK * 1000) / BLOCK_TIME_MS).toFixed(2))
  };
};

app.get('/api/health', (_, res) => res.json({ ok: true, service: 'IL-Watch API (Express)' }));
app.get('/api/watches', (_, res) => res.json(readDb().watches));
app.get('/api/posts', (_, res) => res.json(readDb().posts));
app.get('/api/news', (_, res) => res.json(readDb().news || []));
app.get('/api/formations', (_, res) => res.json(readDb().formations || []));
app.get('/api/listings', (_, res) => res.json(readDb().listings || []));

app.get('/api/blockchain/status', (_, res) => {
  res.json(getBlockchainStats());
});

app.get('/api/blockchain/blocks', (req, res) => {
  const limit = Math.min(Number(req.query.limit || 10), 100);
  const blocks = chainState.blocks.slice(-limit).reverse().map(block => ({
    index: block.index,
    hash: block.hash,
    previousHash: block.previousHash,
    timestamp: block.timestamp,
    validator: block.validator,
    txCount: block.txCount,
    txRoot: block.txRoot
  }));

  res.json(blocks);
});

app.get('/api/blockchain/tx/:hash', (req, res) => {
  const tx = chainState.txByHash.get(req.params.hash);
  if (!tx) return res.status(404).json({ error: 'Transaction introuvable.' });
  return res.json(tx);
});

app.post('/api/blockchain/tx', (req, res) => {
  const { type, assetId, ownerId, metadata } = req.body || {};
  if (!type || !assetId || !ownerId) {
    return res.status(400).json({ error: 'type, assetId et ownerId sont requis.' });
  }

  const tx = createTransaction({ type, assetId, ownerId, metadata });
  const queued = queueTransaction(tx);
  if (!queued.ok) return res.status(429).json({ error: queued.error });

  return res.status(202).json({
    message: 'Transaction acceptée par la blockchain.',
    txHash: tx.hash,
    status: 'queued'
  });
});

app.post('/api/blockchain/tx/batch', (req, res) => {
  const transactions = Array.isArray(req.body?.transactions) ? req.body.transactions : [];
  if (!transactions.length) {
    return res.status(400).json({ error: 'transactions[] est requis.' });
  }

  if (transactions.length > MAX_TX_PER_BLOCK) {
    return res.status(400).json({ error: `batch limité à ${MAX_TX_PER_BLOCK} transactions.` });
  }

  const accepted = [];
  for (const incomingTx of transactions) {
    if (!incomingTx?.type || !incomingTx?.assetId || !incomingTx?.ownerId) {
      return res.status(400).json({ error: 'Chaque transaction doit contenir type, assetId et ownerId.' });
    }

    const tx = createTransaction(incomingTx);
    const queued = queueTransaction(tx);
    if (!queued.ok) {
      return res.status(429).json({ error: queued.error, accepted: accepted.length });
    }

    accepted.push(tx.hash);
  }

  return res.status(202).json({
    message: 'Batch accepté.',
    accepted: accepted.length,
    txHashes: accepted
  });
});

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
