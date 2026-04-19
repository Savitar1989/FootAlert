import express from 'express';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { fetchMatches } from './services/fetcher.js';
import { processMatches } from './services/engine.js';


dotenv.config();

const app = express();
app.use(express.json());

let lastSnapshot = [];

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

cron.schedule('*/30 * * * * *', async () => {
  try {
    const matches = await fetchMatches();
    await processMatches(matches, lastSnapshot);
    lastSnapshot = matches;
  } catch (err) {
    console.error('CRON ERROR:', err.message);
  }
});

app.listen(3001, () => {
  console.log('Backend running on port 3001');
});
