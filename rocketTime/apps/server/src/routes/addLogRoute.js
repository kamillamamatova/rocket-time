import express from 'express';
import { addTimeLogs } from '../services/addLog.js';

const router = express.Router();

//direct to path below
router.post('/', async function(req, res, next) {
  try {
    res.json(await addTimeLogs(req.body));
  } catch (err) {
    console.error(`Error while adding time logs`, err.message);
    next(err);
  }
});

export default router;