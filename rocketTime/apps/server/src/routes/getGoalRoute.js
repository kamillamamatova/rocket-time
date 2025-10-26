import express from 'express';
import { getGoalLogs } from '../services/getGoal.js';

const router = express.Router();

//direct to path below
router.get('/:user_Id', async (req, res) => {
  try {
    const data = await getGoalLogs(req.params.user_Id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;