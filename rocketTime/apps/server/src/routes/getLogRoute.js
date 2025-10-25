import express from 'express';
import { getTimeLogs } from '../services/getLog.js';

const router = express.Router();

//direct to path below
router.get('/:userId', async function(req, res, next) {
  try {
    res.json(await getTimeLogs(req.params.userId));
  } catch (err) {
    console.error(`Error while getting time logs`, err.message);
    next(err);
  }
});

export default router;