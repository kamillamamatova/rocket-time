//api/chat and chatbot entry
import { Router } from 'express';
import { query } from '../services/db.js';
import { parseUserMessage, getCoachResponse } from '../services/aiService.js';
import { calendarForUser } from '../config/google.js';
import { decryptToken } from '../services/tokenCrypto.js';

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
    // Return a timezone-naive datetime string (no Z, no offset) so that Google
    // Calendar interprets it in the event's timeZone field rather than as UTC.
    return `${String(Y).padStart(4,'0')}-${String(M).padStart(2,'0')}-${String(D).padStart(2,'0')}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
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

  // Strip ISO dates (e.g. "2026-03-20") before scanning for times so the
  // dashes inside the date string are not mistaken for a time-range separator.
  const textForTime = text.replace(isoDateRe, ' ');

  let startRaw = null, endRaw = null;

  const mRange = textForTime.match(timeRangeRe);
  if (mRange) {
    startRaw = (mRange[1] || '').trim();        // may contain am/pm
    endRaw   = (mRange[3] || '').trim();        // may omit am/pm
  } else {
    const mSingle = textForTime.match(singleTimeRe);
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

// Google Calendar colorId map
const COLOR_MAP = {
  lavender: '1', sage: '2', grape: '3', flamingo: '4',
  banana: '5', tangerine: '6', orange: '6', peacock: '7',
  teal: '7', blueberry: '8', blue: '8', navy: '8',
  basil: '9', green: '9', tomato: '10', red: '10',
  pink: '4', purple: '3', yellow: '5',
};

// Extract HH:MM from a Google Calendar dateTime string (respects timezone offset)
function getLocalHHMM(dateTimeStr) {
  if (!dateTimeStr) return null;
  // dateTimeStr can be "2026-03-20T13:00:00-04:00" or "2026-03-20T13:00:00Z"
  // We want the wall-clock time in the event's local timezone, which is the
  // time portion before any offset — i.e. just parse "HH:MM" from the string.
  const m = dateTimeStr.match(/T(\d{2}):(\d{2})/);
  if (!m) return null;
  return `${m[1]}:${m[2]}`;
}

async function handleUpdateEventColor(parsedIntent, userId) {
  try {
    const { eventTitle = '', eventStartTime, eventDate, color } = parsedIntent;

    if (!color) {
      return { intent: 'UPDATE_EVENT_COLOR', message: 'Please specify the color you want.' };
    }

    const colorId = COLOR_MAP[color.toLowerCase().trim()];
    if (!colorId) {
      const available = [...new Set(Object.keys(COLOR_MAP))].join(', ');
      return { intent: 'UPDATE_EVENT_COLOR', message: `I don't recognize the color "${color}". Available colors: ${available}.` };
    }

    const creds = await query('SELECT * FROM oauth_credentials WHERE user_id = ?', [userId]);
    const cred = creds[0];
    if (!cred || !cred.access_token) {
      return { intent: 'UPDATE_EVENT_COLOR', message: 'Please connect your Google Calendar first.' };
    }

    const tokens = {
      access_token: decryptToken(cred.access_token),
      refresh_token: decryptToken(cred.refresh_token),
      expiry_date: new Date(cred.token_expiry).getTime(),
    };

    const calendar = await calendarForUser(tokens);

    // Narrow the search window to just the event's date if provided
    let timeMin, timeMax;
    if (eventDate) {
      timeMin = new Date(`${eventDate}T00:00:00`).toISOString();
      timeMax = new Date(`${eventDate}T23:59:59`).toISOString();
    } else {
      const now = new Date();
      const past = new Date(now); past.setDate(past.getDate() - 7);
      const future = new Date(now); future.setDate(future.getDate() + 60);
      timeMin = past.toISOString();
      timeMax = future.toISOString();
    }

    const listRes = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });

    const events = listRes.data.items || [];
    const keyword = eventTitle.toLowerCase();

    // Score each event: time match is highest priority, then title match
    const scored = events.map(e => {
      let score = 0;
      const title = (e.summary || '').toLowerCase();
      const startHHMM = getLocalHHMM(e.start?.dateTime || '');

      if (eventStartTime && startHHMM === eventStartTime) score += 100;
      if (keyword && title.includes(keyword)) score += 10;
      // Partial time match (same hour)
      if (eventStartTime && startHHMM && startHHMM.slice(0, 2) === eventStartTime.slice(0, 2)) score += 5;

      return { event: e, score };
    });

    const best = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score)[0];
    const match = best?.event;

    if (!match) {
      const hint = eventStartTime ? ` at ${eventStartTime}` : '';
      const titleHint = keyword ? ` matching "${eventTitle}"` : '';
      return { intent: 'UPDATE_EVENT_COLOR', message: `I couldn't find an event${titleHint}${hint} in your calendar.` };
    }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: match.id,
      resource: { colorId },
    });

    const colorName = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
    return { intent: 'UPDATE_EVENT_COLOR', message: `Done! "${match.summary}" has been updated to ${colorName}.` };
  } catch (error) {
    console.error('Update event color error:', error);
    return { intent: 'UPDATE_EVENT_COLOR', message: 'Sorry, I couldn\'t update the event color. Please try again.' };
  }
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

router.post('/chat', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch user context
    const goals = await query('SELECT * FROM goals WHERE user_id = ?', [userId]);

    // Run intent classifier to detect actionable requests
    let parsedIntent;
    try {
      parsedIntent = await parseUserMessage(message, { goals });
      console.log('Parsed intent:', parsedIntent.intent);
    } catch (aiError) {
      console.error('Intent parser error:', aiError?.message || aiError);
      parsedIntent = { intent: 'CONVERSATION' };
    }

    // If classifier missed an obvious event, override intent (but keep any extracted fields)
    if (parsedIntent?.intent === 'CONVERSATION' && looksLikeEvent(message)) {
      parsedIntent = { intent: 'CREATE_EVENT', event: parsedIntent.event ?? {} };
    }

    const intent = parsedIntent?.intent;

    // ── Actionable intents ──────────────────────────────────────────────────
    if (intent === 'CREATE_EVENT') {
      const response = await handleCreateEvent(parsedIntent, userId, message);
      return res.json(response);
    }

    if (intent === 'ADD_TASK') {
      const response = await handleAddTask(parsedIntent, userId);
      return res.json(response);
    }

    if (intent === 'UPDATE_EVENT_COLOR') {
      const response = await handleUpdateEventColor(parsedIntent, userId);
      return res.json(response);
    }

    // ── Conversational coaching (everything else) ───────────────────────────
    // Gather richer context for the coach
    const recentLogs = await query(`
      SELECT category, SUM(duration_hr) AS total_hours
      FROM timelogs
      WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY category
    `, [userId]);

    const wastedRow = await query(`
      SELECT COALESCE(SUM(duration_hr), 0) AS wasted
      FROM timelogs
      WHERE user_id = ? AND category = 'wasted' AND date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [userId]);

    const wastedHours = wastedRow[0]?.wasted ?? 0;

    const context = { goals, recentLogs, wastedHours };

    let coachReply;
    try {
      coachReply = await getCoachResponse(message, context, history);
    } catch (aiError) {
      console.error('Coach error:', aiError?.message || aiError);
      coachReply = "I'm having trouble connecting right now. Try again in a moment.";
    }

    return res.json({ intent: 'CONVERSATION', message: coachReply });
  } catch (error) {
    console.error('Chat error:', error);
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
      access_token: decryptToken(cred.access_token),
      refresh_token: decryptToken(cred.refresh_token),
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

