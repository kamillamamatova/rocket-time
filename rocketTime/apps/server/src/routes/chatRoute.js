//api/chat and chatbot entry
import { Router } from 'express';
import { query } from '../services/db.js';
import { parseUserMessage } from '../services/aiService.js';
import { calendarForUser } from '../config/google.js';

const router = Router();

// Main chat endpoint
router.post('/chat', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user profile and goals
    const [users] = await query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    
    const [goals] = await query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const userProfile = { ...user, goals };

    // Parse user message with AI
    const parsedIntent = await parseUserMessage(message, userProfile);
    
    let response = { intent: parsedIntent.intent, message: '' };

    // Handle different intents
    switch (parsedIntent.intent) {
      case 'CREATE_EVENT':
        response = await handleCreateEvent(parsedIntent, userId);
        break;
      case 'ADD_TASK':
        response = await handleAddTask(parsedIntent, userId);
        break;
      case 'PLAN_WEEK':
        response = await handlePlanWeek(parsedIntent, userId);
        break;
      case 'PRIORITIZE':
        response = await handlePrioritize(parsedIntent, userId);
        break;
      case 'ASK_FEEDBACK':
        response = await handleAskFeedback(parsedIntent, userId);
        break;
      case 'SMALL_TALK':
      default:
        response = { intent: 'SMALL_TALK', message: 'I\'m here to help you manage your time and tasks! How can I assist you today?' };
    }

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    next(error);
  }
});

// Helper functions for different intents
async function handleCreateEvent(parsedIntent, userId) {
  try {
    const { event } = parsedIntent;
    if (!event || !event.title) {
      return { intent: 'CREATE_EVENT', message: 'I need more details about the event you want to create.' };
    }

    // Get user's OAuth credentials
    const [creds] = await query('SELECT * FROM oauth_credentials WHERE user_id = ?', [userId]);
    if (!creds || !creds.access_token) {
      return { intent: 'CREATE_EVENT', message: 'Please connect your Google Calendar first.' };
    }

    const tokens = {
      access_token: creds.access_token,
      refresh_token: creds.refresh_token,
      expiry_date: new Date(creds.token_expiry).getTime(),
    };

    const calendar = await calendarForUser(tokens);
    
    // Create calendar event
    const calendarEvent = {
      summary: event.title,
      start: {
        dateTime: event.startTime || new Date().toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: event.endTime || new Date(Date.now() + (event.durationMins || 60) * 60000).toISOString(),
        timeZone: 'America/New_York',
      },
      location: event.location || '',
      attendees: event.attendees || [],
    };

    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: calendarEvent,
    });

    return { 
      intent: 'CREATE_EVENT', 
      message: `Event "${event.title}" has been created successfully!`,
      eventId: result.data.id 
    };
  } catch (error) {
    console.error('Create event error:', error);
    return { intent: 'CREATE_EVENT', message: 'Sorry, I couldn\'t create the event. Please try again.' };
  }
}

async function handleAddTask(parsedIntent, userId) {
  try {
    const { task } = parsedIntent;
    if (!task || !task.title) {
      return { intent: 'ADD_TASK', message: 'I need more details about the task you want to add.' };
    }

    // Add task to database
    const taskId = await query(
      'INSERT INTO goals (user_id, title, target_hours, category, deadline, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, task.title, task.estMinutes ? task.estMinutes / 60 : null, 'productive', task.deadline || null, 'not started']
    );

    return { 
      intent: 'ADD_TASK', 
      message: `Task "${task.title}" has been added to your goals!`,
      taskId: taskId.insertId 
    };
  } catch (error) {
    console.error('Add task error:', error);
    return { intent: 'ADD_TASK', message: 'Sorry, I couldn\'t add the task. Please try again.' };
  }
}

async function handlePlanWeek(parsedIntent, userId) {
  try {
    // Get user's goals and recent time logs
    const [goals] = await query('SELECT * FROM goals WHERE user_id = ? AND status != "completed"', [userId]);
    const [timelogs] = await query('SELECT * FROM timelogs WHERE user_id = ? ORDER BY date DESC LIMIT 7', [userId]);

    const response = {
      intent: 'PLAN_WEEK',
      message: `Here's your weekly plan based on your ${goals.length} active goals and recent activity:`,
      goals: goals.slice(0, 5), // Top 5 goals
      recentActivity: timelogs.slice(0, 3) // Recent 3 activities
    };

    return response;
  } catch (error) {
    console.error('Plan week error:', error);
    return { intent: 'PLAN_WEEK', message: 'I couldn\'t generate your weekly plan. Please try again.' };
  }
}

async function handlePrioritize(parsedIntent, userId) {
  try {
    const [goals] = await query('SELECT * FROM goals WHERE user_id = ? AND status != "completed" ORDER BY deadline ASC, target_hours DESC', [userId]);
    
    return {
      intent: 'PRIORITIZE',
      message: 'Here are your tasks prioritized by deadline and importance:',
      prioritizedGoals: goals.slice(0, 5)
    };
  } catch (error) {
    console.error('Prioritize error:', error);
    return { intent: 'PRIORITIZE', message: 'I couldn\'t prioritize your tasks. Please try again.' };
  }
}

async function handleAskFeedback(parsedIntent, userId) {
  try {
    const [goals] = await query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [timelogs] = await query('SELECT * FROM timelogs WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 7 DAY)', [userId]);
    
    const totalHours = timelogs.reduce((sum, log) => sum + (log.duration_hr || 0), 0);
    const completedGoals = goals.filter(goal => goal.status === 'completed').length;
    
    return {
      intent: 'ASK_FEEDBACK',
      message: `This week you've logged ${totalHours.toFixed(1)} hours and completed ${completedGoals} goals. Keep up the great work!`,
      stats: { totalHours, completedGoals, activeGoals: goals.length - completedGoals }
    };
  } catch (error) {
    console.error('Ask feedback error:', error);
    return { intent: 'ASK_FEEDBACK', message: 'I couldn\'t generate your feedback. Please try again.' };
  }
}

export default router;
