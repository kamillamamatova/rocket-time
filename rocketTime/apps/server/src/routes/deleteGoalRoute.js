import express from 'express';

const router = express.Router();

// Legacy endpoint removed — use DELETE /calendar/goals/:id instead
router.delete('/:goal_Id', (req, res) => {
  res.status(410).json({ error: 'This endpoint has been removed. Use DELETE /calendar/goals/:id instead.' });
});

export default router;
