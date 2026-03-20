import express from 'express';

const router = express.Router();

// Legacy endpoint removed — use GET /calendar/goals instead
router.get('/:user_Id', (req, res) => {
  res.status(410).json({ error: 'This endpoint has been removed. Use GET /calendar/goals instead.' });
});

export default router;
