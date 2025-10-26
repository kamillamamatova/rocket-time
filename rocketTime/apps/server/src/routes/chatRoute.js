//api/chat and chatbot entry
import { Router } from 'express';
import { query } from '../services/db.js';
import { parseUserMessage } from '../services/aiService.js';
import { calendarForUser } from '../config/google.js';

const router = Router();


// Looks like an event request? (used to override SMALL_TALK)
function looksLikeEvent(text) {
  if (!text) return false;
  return /(?:make|create|schedule|add)\s+(?:an?\s+)?(?:event|meeting|appointment)\b/i.test(text)
      || /\b(?:today|tomorrow|mon|tue|wed|thu|fri|sat|sun|next\s+(?:week|mon|tue|wed|thu|fri|sat|sun))\b/i.test(text)
      || /\b\d{4}-\d{2}-\d{2}\b/.test(text)
      || /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/i.test(text)
      || /\b\d{1,2}\s*(am|pm)\b/i.test(text)
      || /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i.test(text);
}

// Normalize "12pm", "4 pm", "16:30" -> "HH:MM" (24h)
function normalizeTimeTo24h(s) {
  if (!s) return null;
  const str = s.toString().trim().toLowerCase();
  const m1 = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (m1) {
    let h = parseInt(m1[1], 10);
    const min = m1[2] ? parseInt(m1[2], 10) : 0;
    const mer = m1[3].toLowerCase();
    if (mer === 'pm' && h !== 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
  }
  const m2 = str.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m2) {
    const h = Math.min(23, parseInt(m2[1], 10));
    const min = m2[2] ? Math.min(59, parseInt(m2[2], 10)) : 0;
    return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
  }
  return null;
}

// Normalize "October 29th" -> "YYYY-MM-DD", assume this/next year
function normalizeDateWithAssumedYear(s) {
  if (!s) return null;
  const raw = s.toString().trim();
  const cleaned = raw.replace(/\b(\d+)(st|nd|rd|th)\b/gi, '$1');

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  const hasYear = /\b\d{4}\b/.test(cleaned);
  const today = new Date();
  const year = today.getFullYear();

  const candidateStr = hasYear ? cleaned : `${cleaned} ${year}`;
  const candidate = new Date(candidateStr);
  if (isNaN(candidate.getTime())) return null;

  // If no explicit year and date already passed this year, roll to next year
  if (!hasYear) {
    const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (midnight(candidate) < midnight(today)) {
      candidate.setFullYear(year + 1);
    }
  }

  const yyyy = candidate.getFullYear();
  const mm = String(candidate.getMonth() + 1).padStart(2, '0');
  const dd = String(candidate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// STRICT parser: returns ISO string or null
function parseDateTime(date, time) {
  try {
    const normDate = normalizeDateWithAssumedYear(date);
    const normTime = normalizeTimeTo24h(time);
    if (!normDate || !normTime) return null;
    const [Y, M, D] = normDate.split('-').map(Number);
    const [h, m] = normTime.split(':').map(Number);
    return new Date(Y, M - 1, D, h, m, 0, 0).toISOString();
  } catch {
    return null;
  }
}

// Extract date + (start/end) time from raw user text if the model missed them.
// Handles: "Oct 29", "October 29th", "2025-10-29", "12pm to 4", "12-4" etc.
function extractDateTimeFromText(text) {
  if (!text) return {};
  const monthRx = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)';
  const dateRe = new RegExp(`\\b(${monthRx})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,\\s*\\d{4})?\\b`, 'i');
  const isoDateRe = /\b\d{4}-\d{2}-\d{2}\b/;

  // capture times; second may omit am/pm
  const timeRangeRe = /\b(\d{1,2}(?::\d{2})?\s*(am|pm)?)\s*(?:to|-|–)\s*(\d{1,2}(?::\d{2})?\s*(am|pm)?)\b/i;
  const singleTimeRe = /\b(\d{1,2}(?::\d{2})?\s*(am|pm)?)\b/i;

  let dateStr = null;
  const mIso = text.match(isoDateRe);
  if (mIso) dateStr = mIso[0];
  else {
    const mTextDate = text.match(dateRe);
    if (mTextDate) dateStr = mTextDate[0];
  }

  let startRaw = null, endRaw = null;

  const mRange = text.match(timeRangeRe);
  if (mRange) {
    startRaw = (mRange[1] || '').trim();        // may contain am/pm
    endRaw   = (mRange[3] || '').trim();        // may omit am/pm
  } else {
    const mSingle = text.match(singleTimeRe);
    if (mSingle) startRaw = (mSingle[1] || '').trim();
  }

  // Inherit meridiem when missing on end (e.g., "12pm to 4" -> end is pm)
  if (startRaw && endRaw && !/am|pm/i.test(endRaw) && /am|pm/i.test(startRaw)) {
    endRaw += startRaw.toLowerCase().includes('am') ? ' am' : ' pm';
  }

  // Heuristic: if both lack am/pm ("12-4"), assume PM for common afternoon ranges
  const bothNoMeridiem = startRaw && endRaw && !/am|pm/i.test(startRaw) && !/am|pm/i.test(endRaw);
  if (bothNoMeridiem) {
    const h1 = parseInt(startRaw.split(':')[0], 10);
    if (h1 >= 12 || (h1 >= 1 && h1 <= 7)) {
      startRaw += ' pm';
      endRaw   += ' pm';
    }
  }

  const date = dateStr ? normalizeDateWithAssumedYear(dateStr) : null;
  const startTime = startRaw ? normalizeTimeTo24h(startRaw) : null;
  let endTime = endRaw ? normalizeTimeTo24h(endRaw) : null;

  // If end <= start but could be same-meridiem afternoon intent, bump end by 12h
  if (date && startTime && endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;

    if (endMins <= startMins) {
      const eh12 = ((eh + 12) % 24) * 60 + em;
      if (eh < 12 && eh12 > startMins) {
        endTime = `${String((eh + 12)).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
      }
    }
  }

  return { date, startTime, endTime };
}

// Clean up noisy titles/descriptions
function stripEmojisAndWeird(title) {
  return (title || '')
    .replace(/[\p{Extended_Pictographic}\u2600-\u27BF]+/gu, '')
    .replace(/[:;=8][-^]?[)D]+/g, '')
    .replace(/[!?.]{2,}/g, m => m[0])
    .replace(/\s+/g, ' ')
    .trim();
}

// Formatters for message text (client may only render message string)
function formatGoalsList(goals, max = 5) {
  if (!goals?.length) return '• No active goals yet.';
  return goals.slice(0, max).map((g, i) => {
    const dl = g.deadline ? ` (due ${new Date(g.deadline).toLocaleDateString()})` : '';
    return `${i + 1}. ${g.title}${dl}`;
  }).join('\n');
}
function formatTimelogs(logs, max = 3) {
  if (!logs?.length) return '• No recent activity.';
  return logs.slice(0, max).map((l) => {
    const dt = new Date(l.date).toLocaleDateString();
    const hrs = (l.duration_hr ?? 0).toFixed(1);
    const title = l.title || l.category || 'Activity';
    return `• ${dt}: ${title} — ${hrs}h`;
  }).join('\n');
}

/* ======================= Main chat endpoint ======================= */

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
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    const goals = await query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const userProfile = { ...user, goals };

    console.log('Parsing user message with AI...');
    const parsedIntent = await parseUserMessage(message, userProfile);
    console.log('Parsed intent:', parsedIntent);

    // If model says SMALL_TALK but text looks like an event, treat as CREATE_EVENT
    if (parsedIntent?.intent === 'SMALL_TALK' && looksLikeEvent(message)) {
      parsedIntent.intent = 'CREATE_EVENT';
      parsedIntent.event = parsedIntent.event ?? {};
    }

    let response = { intent: parsedIntent.intent, message: '' };

    // Handle different intents
    switch (parsedIntent.intent) {
      case 'CREATE_EVENT':
        response = await handleCreateEvent(parsedIntent, userId, message); // pass raw message
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
      default: {
        const goalCount = goals.length;
        const activeGoals = goals.filter(g => g.status !== 'completed').length;
        response = { 
          intent: 'SMALL_TALK', 
          message: `I'm here to help you manage your time and tasks! You have ${goalCount} goals, with ${activeGoals} currently active. How can I assist you today?` 
        };
      }
    }

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/* ======================= Intent handlers ======================= */

// (kept for compatibility; not used by strict parser paths)
function parseRelativeDate(dateStr) {
  if (!dateStr) return null;
  const lowerStr = dateStr.toLowerCase();
  const today = new Date();

  if (lowerStr.includes('today')) return today;
  if (lowerStr.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  if (lowerStr.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  if (lowerStr.includes('next monday')) {
    const nextMonday = new Date(today);
    const dayOfWeek = nextMonday.getDay();
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    return nextMonday;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

async function handleCreateEvent(parsedIntent, userId, rawMessage) {
  try {
    const { event = {} } = parsedIntent;
    console.log('Creating event with data:', event);

    // If LLM missed fields, try to extract from the original user message
    if (!event.date || !event.startTime || !event.endTime) {
      const extracted = extractDateTimeFromText(rawMessage || '');
      console.log('Extracted from text:', extracted);
      const { date, startTime, endTime } = extracted;
      event.date = event.date || date;
      event.startTime = event.startTime || startTime;
      event.endTime = event.endTime || endTime;
      if (!event.durationMins && event.startTime && event.endTime) {
        const startISO = parseDateTime(event.date, event.startTime);
        const endISO = parseDateTime(event.date, event.endTime);
        if (startISO && endISO) event.durationMins = Math.max(0, (new Date(endISO) - new Date(startISO)) / 60000);
      }
    }

    // Require minimal fields now (prevents "now" default)
    if (!event.date || !event.startTime) {
      return { 
        intent: 'CREATE_EVENT', 
        message: 'Please include a date (e.g., "2025-10-29" or "October 29th") and a start time (e.g., "12pm" or "12:00").'
      };
    }

    // Get user's OAuth credentials
    const creds = await query('SELECT * FROM oauth_credentials WHERE user_id = ?', [userId]);
    const cred = creds[0];
    if (!cred || !cred.access_token) {
      return { intent: 'CREATE_EVENT', message: 'Please connect your Google Calendar first.' };
    }

    const tokens = {
      access_token: cred.access_token,
      refresh_token: cred.refresh_token,
      expiry_date: new Date(cred.token_expiry).getTime(),
    };

    const calendar = await calendarForUser(tokens);

    // Parse start time (strict, no "now" fallback)
    const startDateTime = parseDateTime(event.date, event.startTime);
    if (!startDateTime) {
      return { intent: 'CREATE_EVENT', message: 'I couldn’t understand the date/time. Try "October 29th at 12pm".' };
    }

    // Calculate end time
    let endDateTime = null;
    if (event.endTime) {
      const endParsed = parseDateTime(event.date, event.endTime);
      if (!endParsed) {
        return { intent: 'CREATE_EVENT', message: 'I couldn’t understand the end time. Try "4pm" or "16:00".' };
      }
      if (new Date(endParsed) <= new Date(startDateTime)) {
        return { intent: 'CREATE_EVENT', message: 'End time must be after start time.' };
      }
      endDateTime = endParsed;
    } else if (event.durationMins) {
      endDateTime = new Date(new Date(startDateTime).getTime() + event.durationMins * 60000).toISOString();
    } else {
      endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60000).toISOString();
    }

    console.log('Event times:', { start: startDateTime, end: endDateTime });

    // Clamp title/description
    const cleanSummary = stripEmojisAndWeird(event.title || 'Event').slice(0, 80);
    const cleanDescription = (event.description || '').replace(/\s+/g, ' ').trim().slice(0, 800);

    // Create calendar event
    const calendarEvent = {
      summary: cleanSummary,
      start: { dateTime: startDateTime, timeZone: event.timezone || 'America/New_York' },
      end:   { dateTime: endDateTime,   timeZone: event.timezone || 'America/New_York' },
      location: event.location || '',
      attendees: event.attendees || [],
      description: cleanDescription,
    };

    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: calendarEvent,
    });

    return { 
      intent: 'CREATE_EVENT', 
      message: `Event "${cleanSummary}" has been created successfully from ${new Date(startDateTime).toLocaleString()} to ${new Date(endDateTime).toLocaleString()}!`,
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
    const goals = await query('SELECT * FROM goals WHERE user_id = ? AND status != "completed"', [userId]);
    const timelogs = await query('SELECT * FROM timelogs WHERE user_id = ? ORDER BY date DESC LIMIT 7', [userId]);

    const goalsList = formatGoalsList(goals, 5);
    const activityList = formatTimelogs(timelogs, 3);

    return {
      intent: 'PLAN_WEEK',
      message:
        `Here's your weekly plan based on your ${goals.length} active goals:\n\n` +
        `Top goals:\n${goalsList}\n\n` +
        `Recent activity:\n${activityList}`,
      goals: goals.slice(0, 5),
      recentActivity: timelogs.slice(0, 3)
    };
  } catch (error) {
    console.error('Plan week error:', error);
    return { intent: 'PLAN_WEEK', message: 'I couldn\'t generate your weekly plan. Please try again.' };
  }
}

async function handlePrioritize(parsedIntent, userId) {
  try {
    const goals = await query('SELECT * FROM goals WHERE user_id = ? AND status != "completed" ORDER BY deadline ASC, target_hours DESC', [userId]);
    const list = formatGoalsList(goals, 5);
    return {
      intent: 'PRIORITIZE',
      message: `Here are your tasks prioritized by deadline and importance:\n\n${list}`,
      prioritizedGoals: goals.slice(0, 5)
    };
  } catch (error) {
    console.error('Prioritize error:', error);
    return { intent: 'PRIORITIZE', message: 'I couldn\'t prioritize your tasks. Please try again.' };
  }
}

async function handleAskFeedback(parsedIntent, userId) {
  try {
    const goals = await query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const timelogs = await query('SELECT * FROM timelogs WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 7 DAY)', [userId]);
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

