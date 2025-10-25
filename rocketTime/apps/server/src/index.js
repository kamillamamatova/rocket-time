import express from 'express';
import cors from 'cors';
import session from 'cookie-session';
import 'dotenv/config';

import auth from './routes/auth.js';
import agent from './routes/chatRoute.js';
import calendar from './routes/taskRoutes.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({ name: 'sid', secret: process.env.SESSION_SECRET || 'dev', httpOnly: true }));

app.use('/api/auth', auth);
app.use('/api/agent', agent);
app.use('/api/calendar', calendar);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
