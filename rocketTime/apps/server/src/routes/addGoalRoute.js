import express from 'express';
import { addGoals } from '../services/addGoals.js';

const router = express.Router();

router.post('/', async function(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Derive user_id from session — never trust client-supplied user_id
    const payload = { ...req.body, user_id: req.session.userId };
    res.json(await addGoals(payload));
  } catch (err) {
    console.error(`Error while adding goals`, err.message);
    next(err);
  }
});

export default router;