import express from 'express';
import { deleteGoal } from '../services/deleteGoal.js';

const router = express.Router();

//direct to path below
router.delete('/:goal_Id', async function(req, res, next) {
  try {
    res.json(await deleteGoal(req.params.goal_Id));
  } catch (err) {
    console.error(`Error while deleting goal`, err.message);
    next(err);
  }
});

export default router;