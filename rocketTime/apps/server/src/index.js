import express from 'express';
import cors from 'cors';
import session from 'cookie-session';
import 'dotenv/config';

import auth from './routes/auth.js';
import agent from './routes/chatRoute.js';
import calendar from './routes/taskRoutes.js';

import {query} from './services/db.js';
import getLogRouter from './routes/getLogRoute.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({ name: 'sid', secret: process.env.SESSION_SECRET || 'dev', httpOnly: true }));

app.use('/api/auth', auth);
app.use('/api/agent', agent);
app.use('/api/calendar', calendar);

app.get('/health', (_req, res) => res.json({ ok: true }));

//call getLog.js
app.use('/getLog', getLogRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.get('/db-test', async (req, res) => {
  try {
    const results = await query('SELECT NOW() AS currentTime');
    res.json({ status: 'DB Connected!', time: results[0].currentTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
