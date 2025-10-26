import express from 'express';
import cors from 'cors';
import session from 'cookie-session';
import 'dotenv/config';

import auth from './apps/server/src/routes/auth.js';
import agent from './apps/server/src/routes/chatRoute.js';
import calendar from './apps/server/src/routes/taskRoutes.js';

import db from './apps/server/src/services/db.js';
import getLogRouter from './apps/server/src/routes/getLogRoute.js';
import addLogRouter from './apps/server/src/routes/addLogRoute.js';
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

app.use('/addLog', addLogRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.get('/db-test', async (req, res) => {
  try {
    const results = await db.query('SELECT NOW() AS currentTime');
    res.json({ status: 'DB Connected!', time: results[0].currentTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
