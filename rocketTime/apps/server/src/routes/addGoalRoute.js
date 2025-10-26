import express from 'express';
import { addGoals } from '../services/addGoals.js';

const router = express.Router();

//direct to path below
router.post('/', async function(req, res, next) {
  try {
    res.json(await addGoals(req.body));
  } catch (err) {
    console.error(`Error while adding goals`, err.message);
    next(err);
  }
});

export default router;