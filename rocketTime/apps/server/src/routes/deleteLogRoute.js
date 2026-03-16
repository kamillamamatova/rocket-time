import express from 'express';
import { deleteTimeLogs } from '../services/deleteLog.js';

const router = express.Router();

//direct to path below
router.delete('/:timelog_Id', async function(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    res.json(await deleteTimeLogs(req.params.timelog_Id, req.session.userId));
  } catch (err) {
    console.error(`Error while deleting time logs`, err.message);
    next(err);
  }
});

export default router;
