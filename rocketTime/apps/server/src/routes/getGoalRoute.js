import express from 'express';
import { getGoalLogsByUserSession } from '../services/getGoal.js';

const router = express.Router();

//direct to path below
router.get('/:user_Id', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const data = await getGoalLogsByUserSession(req.session.userId, req.params.user_Id);

    if (data.error === 'Forbidden') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
