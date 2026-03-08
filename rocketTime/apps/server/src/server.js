import express from 'express';
import cors from 'cors';
import session from 'cookie-session';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chatRoute.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(
  session({
    name: 'sid',
    keys: [process.env.SESSION_SECRET || 'dev'],
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  })
);

app.use('/auth', authRoutes);
app.use('/agent', chatRoutes);

app.get('/health', (_, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server on port ${port}`));
