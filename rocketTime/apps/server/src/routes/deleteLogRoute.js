import express from 'express';

const router = express.Router();

// Legacy endpoint removed — use DELETE /calendar/timelogs/:id instead
router.delete('/:timelog_Id', (req, res) => {
  res.status(410).json({ error: 'This endpoint has been removed. Use DELETE /calendar/timelogs/:id instead.' });
});

export default router;
