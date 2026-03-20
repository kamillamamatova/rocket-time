import express from 'express';
import { addGoals } from '../services/addGoals.js';

const router = express.Router();

router.post('/', async function(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    res.json(await addGoals(req.body, req.session.userId));
  } catch (err) {
    console.error(`Error while adding goals`, err.message);
    next(err);
  }
});

export default router;