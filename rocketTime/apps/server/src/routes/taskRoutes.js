//Create, Read, Update, Delete operations for your two core objects—goals and 
//tasks—so our agent (and UI) can store and manage them in MySQL.

import { Router } from 'express';
import { query } from '../services/db.js';

const router = Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// GET /api/calendar/goals - Get all goals for the authenticated user
router.get('/:userId', async (req, res, next) => {
  try {
    //const userId = req.session.userId;
   // const { status, category, limit = 50, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM goals WHERE user_id = ?';
    const params = [userId];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [goals] = await query(sql, params);
    res.json({ goals });
  } catch (error) {
    console.error('Get goals error:', error);
    next(error);
  }
});

// GET /api/calendar/goals/:id - Get a specific goal
router.get('/goals/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const goalId = req.params.id;
    
    const [goals] = await query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [goalId, userId]);
    
    if (goals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json({ goal: goals[0] });
  } catch (error) {
    console.error('Get goal error:', error);
    next(error);
  }
});

// POST /api/calendar/goals - Create a new goal
router.post('/goals', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { title, target_hours, category, deadline, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const validCategories = ['productive', 'learning', 'exercise', 'social', 'entertainment'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const result = await query(
      'INSERT INTO goals (user_id, title, target_hours, category, deadline, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, title, target_hours || null, category || 'productive', deadline || null, description || null, 'not started']
    );
    
    const [newGoal] = await query('SELECT * FROM goals WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ goal: newGoal[0] });
  } catch (error) {
    console.error('Create goal error:', error);
    next(error);
  }
});

// PUT /api/calendar/goals/:id - Update a goal
router.put('/goals/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const goalId = req.params.id;
    const { title, target_hours, category, deadline, description, status, progress_hours } = req.body;
    
    // Check if goal exists and belongs to user
    const [existingGoals] = await query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [goalId, userId]);
    if (existingGoals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const validCategories = ['productive', 'learning', 'exercise', 'social', 'entertainment'];
    const validStatuses = ['not started', 'in progress', 'completed'];
    
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (target_hours !== undefined) { updates.push('target_hours = ?'); params.push(target_hours); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (deadline !== undefined) { updates.push('deadline = ?'); params.push(deadline); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (progress_hours !== undefined) { updates.push('progress_hours = ?'); params.push(progress_hours); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(goalId, userId);
    const sql = `UPDATE goals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    
    await query(sql, params);
    
    const [updatedGoal] = await query('SELECT * FROM goals WHERE id = ?', [goalId]);
    res.json({ goal: updatedGoal[0] });
  } catch (error) {
    console.error('Update goal error:', error);
    next(error);
  }
});

// DELETE /api/calendar/goals/:id - Delete a goal
router.delete('/goals/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const goalId = req.params.id;
    
    const result = await query('DELETE FROM goals WHERE id = ? AND user_id = ?', [goalId, userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    next(error);
  }
});

// GET /api/calendar/timelogs - Get time logs for the authenticated user
router.get('/timelogs', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { goal_id, category, start_date, end_date, limit = 50, offset = 0 } = req.query;
    
    let sql = 'SELECT tl.*, g.title as goal_title FROM timelogs tl LEFT JOIN goals g ON tl.goal_id = g.id WHERE tl.user_id = ?';
    const params = [userId];
    
    if (goal_id) {
      sql += ' AND tl.goal_id = ?';
      params.push(goal_id);
    }
    
    if (category) {
      sql += ' AND tl.category = ?';
      params.push(category);
    }
    
    if (start_date) {
      sql += ' AND tl.date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND tl.date <= ?';
      params.push(end_date);
    }
    
    sql += ' ORDER BY tl.date DESC, tl.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [timelogs] = await query(sql, params);
    res.json({ timelogs });
  } catch (error) {
    console.error('Get timelogs error:', error);
    next(error);
  }
});

// POST /api/calendar/timelogs - Create a new time log
router.post('/timelogs', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { goal_id, date, duration_hr, category, description } = req.body;
    
    if (!date || !duration_hr || !category) {
      return res.status(400).json({ error: 'Date, duration, and category are required' });
    }
    
    const validCategories = ['productive', 'learning', 'exercise', 'social', 'entertainment', 'time wasted'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    // If goal_id is provided, verify it belongs to the user
    if (goal_id) {
      const [goals] = await query('SELECT id FROM goals WHERE id = ? AND user_id = ?', [goal_id, userId]);
      if (goals.length === 0) {
        return res.status(400).json({ error: 'Invalid goal_id' });
      }
    }
    
    const result = await query(
      'INSERT INTO timelogs (user_id, goal_id, date, duration_hr, category, description) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, goal_id || null, date, duration_hr, category, description || null]
    );
    
    const [newTimelog] = await query('SELECT tl.*, g.title as goal_title FROM timelogs tl LEFT JOIN goals g ON tl.goal_id = g.id WHERE tl.id = ?', [result.insertId]);
    
    res.status(201).json({ timelog: newTimelog[0] });
  } catch (error) {
    console.error('Create timelog error:', error);
    next(error);
  }
});

// PUT /api/calendar/timelogs/:id - Update a time log
router.put('/timelogs/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const timelogId = req.params.id;
    const { goal_id, date, duration_hr, category, description } = req.body;
    
    // Check if timelog exists and belongs to user
    const [existingTimelogs] = await query('SELECT * FROM timelogs WHERE id = ? AND user_id = ?', [timelogId, userId]);
    if (existingTimelogs.length === 0) {
      return res.status(404).json({ error: 'Time log not found' });
    }
    
    const validCategories = ['productive', 'learning', 'exercise', 'social', 'entertainment', 'time wasted'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    // If goal_id is provided, verify it belongs to the user
    if (goal_id) {
      const [goals] = await query('SELECT id FROM goals WHERE id = ? AND user_id = ?', [goal_id, userId]);
      if (goals.length === 0) {
        return res.status(400).json({ error: 'Invalid goal_id' });
      }
    }
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    if (goal_id !== undefined) { updates.push('goal_id = ?'); params.push(goal_id); }
    if (date !== undefined) { updates.push('date = ?'); params.push(date); }
    if (duration_hr !== undefined) { updates.push('duration_hr = ?'); params.push(duration_hr); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(timelogId, userId);
    const sql = `UPDATE timelogs SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    
    await query(sql, params);
    
    const [updatedTimelog] = await query('SELECT tl.*, g.title as goal_title FROM timelogs tl LEFT JOIN goals g ON tl.goal_id = g.id WHERE tl.id = ?', [timelogId]);
    res.json({ timelog: updatedTimelog[0] });
  } catch (error) {
    console.error('Update timelog error:', error);
    next(error);
  }
});

// DELETE /api/calendar/timelogs/:id - Delete a time log
router.delete('/timelogs/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const timelogId = req.params.id;
    
    const result = await query('DELETE FROM timelogs WHERE id = ? AND user_id = ?', [timelogId, userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Time log not found' });
    }
    
    res.json({ message: 'Time log deleted successfully' });
  } catch (error) {
    console.error('Delete timelog error:', error);
    next(error);
  }
});

// GET /api/calendar/stats - Get user statistics
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    
    // Get goal statistics
    const [goalStats] = await query(`
      SELECT 
        COUNT(*) as total_goals,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_goals,
        SUM(CASE WHEN status = 'in progress' THEN 1 ELSE 0 END) as in_progress_goals,
        SUM(CASE WHEN status = 'not started' THEN 1 ELSE 0 END) as not_started_goals
      FROM goals WHERE user_id = ?
    `, [userId]);
    
    // Get time log statistics for the last 30 days
    const [timeStats] = await query(`
      SELECT 
        SUM(duration_hr) as total_hours,
        COUNT(*) as total_logs,
        AVG(duration_hr) as avg_session_length
      FROM timelogs 
      WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [userId]);
    
    // Get category breakdown
    const [categoryStats] = await query(`
      SELECT 
        category,
        SUM(duration_hr) as total_hours,
        COUNT(*) as log_count
      FROM timelogs 
      WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY category
      ORDER BY total_hours DESC
    `, [userId]);
    
    res.json({
      goals: goalStats[0],
      time: timeStats[0],
      categories: categoryStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    next(error);
  }
});

export default router;
