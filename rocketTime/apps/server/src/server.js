//app bootstrap

import express from 'express';
import cors from 'cors';
import session from 'cookie-session';
import 'dotenv/config';

import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({ name: 'sid', secret: process.env.SESSION_SECRET, httpOnly: true }));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (_, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server on http://localhost:${port}`));
