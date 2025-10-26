import express from 'express';
import cors from 'cors';
import session from 'cookie-session';
import 'dotenv/config';

import auth from './routes/auth.js';
import agent from './routes/chatRoute.js';
import calendar from './routes/taskRoutes.js';

import db from './services/db.js';
import getLogRouter from './routes/getLogRoute.js';
import getGoalRouter from './routes/getGoalRoute.js';
import addLogRouter from './routes/addLogRoute.js';
import deleteLogRouter from './routes/deleteLogRoute.js';
import deleteGoalRouter from './routes/deleteGoalRoute.js';

const app = express();

// --- CORS must allow your frontend origin and credentials ---
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// app.use(session({ name: 'sid', secret: process.env.SESSION_SECRET || 'dev', httpOnly: true }));
app.use(session({
  name: 'sid',
  keys: [process.env.SESSION_SECRET || 'dev'], // cookie-session expects keys[]
  maxAge: 30 * 24 * 60 * 60 * 1000,            // 30 days
  sameSite: 'lax',                              // fine for OAuth redirect on localhost
  secure: false,                                // set true in prod over HTTPS
  httpOnly: true
}));

app.use('/auth', auth);
app.use('/agent', agent);
app.use('/calendar', calendar);

app.get('/health', (_req, res) => res.json({ ok: true }));

//call get
app.use('/getLog', getLogRouter);
app.use('/getGoal', getGoalRouter);

app.use('/addLog', addLogRouter);
app.use('/deleteLog', deleteLogRouter);
app.use('/deleteGoal', deleteGoalRouter);

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


const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
