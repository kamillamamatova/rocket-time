//google OAuth login/callback

//placeholder for testing
import { Router } from 'express';
const r = Router();
r.get('/me', (_req, res) => res.json({ user: null }));
export default r;
