//api/chat and chatbot entry


import { Router } from 'express';
const r = Router();
r.post('/chat', (req, res) => res.json({ ok: true, echo: req.body?.message || '' }));
export default r;

// import { Router } from 'express';
// import { pool } from '../config/db.js';
// import { handleChatTurn } from '../agents/plannerAgent.js';

// const router = Router();

// router.post('/', async (req, res, next) => {
//   try {
//     const userId = req.session.userId;                  // assume simple session
//     const [users] = await pool.query('SELECT * FROM users WHERE id=?', [userId]);
//     const user = users[0];

//     // load oauth tokens for user
//     const [tk] = await pool.query('SELECT * FROM oauth_credentials WHERE user_id=?', [userId]);
//     const creds = tk[0];
//     const tokens = {
//       access_token: creds.access_token,
//       refresh_token: creds.refresh_token,
//       expiry_date: new Date(creds.token_expiry).getTime(),
//     };

//     const result = await handleChatTurn({ user, tokens, message: req.body.message });
//     res.json(result);
//   } catch (e) { next(e); }
// });

// export default router;
