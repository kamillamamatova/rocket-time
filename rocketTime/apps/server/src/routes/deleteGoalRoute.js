import express from 'express';
import { deleteGoal } from '../services/deleteGoal.js';

const router = express.Router();

//direct to path below
router.delete('/:goal_Id', async function(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    res.json(await deleteGoal(req.params.goal_Id, req.session.userId));
  } catch (err) {
    console.error(`Error while deleting goal`, err.message);
    next(err);
  }
});

export default router;
