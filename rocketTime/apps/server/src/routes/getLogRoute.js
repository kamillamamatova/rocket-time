import express from 'express';

const router = express.Router();

// Legacy endpoint removed — use GET /calendar/timelogs instead
router.get('/:userId', (req, res) => {
  res.status(410).json({ error: 'This endpoint has been removed. Use GET /calendar/timelogs instead.' });
});

export default router;
