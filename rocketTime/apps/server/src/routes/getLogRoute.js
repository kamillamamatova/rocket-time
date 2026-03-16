import express from 'express';
import { getTimeLogByUserSession } from '../services/getLog.js';

const router = express.Router();

//direct to path below
router.get('/:userId', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const data = await getTimeLogByUserSession(req.session.userId, req.params.userId);

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
