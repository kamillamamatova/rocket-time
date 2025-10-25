//Create, Read, Update, Delete operations for your two core objects—goals and 
//tasks—so our agent (and UI) can store and manage them in MySQL.

//placeholder for testing 
import { Router } from 'express';
const r = Router();
r.get('/ping', (_req, res) => res.json({ ok: true }));
export default r;
