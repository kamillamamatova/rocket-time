import express from 'express';
import { addTimeLogs } from '../services/addLog.js';

const router = express.Router();

//direct to path below
router.post('/', async function(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const payload = { ...req.body, user_id: req.session.userId };
    res.json(await addTimeLogs(payload));
  } catch (err) {
    console.error(`Error while adding time logs`, err.message);
    next(err);
  }
});

export default router;
