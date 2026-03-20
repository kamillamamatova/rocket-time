import 'dotenv/config';
import Groq from 'groq-sdk';

// ── Shared ──────────────────────────────────────────────────────────────────

function getClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');
  return new Groq({ apiKey });
}

// ── 1. Intent parser (structured, JSON only) ────────────────────────────────
// Used only for clearly actionable requests: CREATE_EVENT, ADD_TASK.

const INTENT_SYSTEM = `
You are an intent classifier for a time-management app.
Respond ONLY with a valid JSON object — no markdown, no explanation.

Classify the message into exactly one of:
["CREATE_EVENT", "ADD_TASK", "ACTION_OTHER", "CONVERSATION"]

Use "CONVERSATION" for anything that is not a clear request to create a calendar
event or add a task (questions, advice requests, reflections, planning chat, etc.).

When intent = "CREATE_EVENT":
{
  "intent": "CREATE_EVENT",
  "event": {
    "title": "...",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "durationMins": 60,
    "location": "...",
    "description": "..."
  }
}

When intent = "ADD_TASK":
{
  "intent": "ADD_TASK",
  "task": {
    "title": "...",
    "estMinutes": 60,
    "deadline": "YYYY-MM-DD"
  }
}

For "ACTION_OTHER" or "CONVERSATION": { "intent": "ACTION_OTHER" } or { "intent": "CONVERSATION" }

RULES:
- Dates must be absolute YYYY-MM-DD.
- Times must be 24-hour HH:MM.
- Only classify as CREATE_EVENT / ADD_TASK when the user is clearly requesting that action.
`;

export async function parseUserMessage(message, userProfile) {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: INTENT_SYSTEM },
      {
        role: 'user',
        content: `User goals: ${JSON.stringify(userProfile?.goals ?? [])}\nMessage: """${message}"""`,
      },
    ],
    temperature: 0,
    max_tokens: 512,
    response_format: { type: 'json_object' },
  });

  const txt = completion.choices[0]?.message?.content || '{"intent":"CONVERSATION"}';
  try {
    return JSON.parse(txt);
  } catch {
    return { intent: 'CONVERSATION' };
  }
}

// ── 2. Conversational coach ──────────────────────────────────────────────────
// Used for all non-action messages. Returns a plain text coaching response.

const COACH_SYSTEM = `
You are a sharp, personalized time-management coach inside a productivity app called Rocket Time.
You help users reflect on their habits, plan their time strategically, and make progress on their goals.

Tone: direct, warm, specific. Never generic or filler.
Format: plain conversational text. No bullet overload. No markdown headers.
Length: 3–6 sentences for most replies. Ask one focused follow-up when it adds value.

You will receive:
- The user's active goals (name, target hours, hours logged so far, deadline if set)
- Recent time logs (last 7 days, category + hours)
- Total hours spent on wasted activities this week
- The last several messages of the conversation

Use this data to give concrete, personalized answers. Reference their actual goals and numbers.
If you don't have enough data (no goals, no logs), acknowledge it briefly and ask what they're working on.
Do NOT say "I'm here to help" or repeat the user's question back to them.
`;

export async function getCoachResponse(message, context, history) {
  const client = getClient();

  const { goals = [], recentLogs = [], wastedHours = 0 } = context;

  const contextBlock = `
Active goals:
${goals.length
    ? goals.map(g => {
        const pct = g.targetHours > 0 ? Math.round((g.currentHours / g.targetHours) * 100) : 0;
        const dl = g.deadline ? ` (due ${new Date(g.deadline).toLocaleDateString()})` : '';
        return `- ${g.name || g.title}: ${g.currentHours ?? 0}h logged / ${g.targetHours ?? '?'}h target${dl} — ${pct}% done`;
      }).join('\n')
    : '- No active goals set yet.'}

Recent activity (last 7 days):
${recentLogs.length
    ? recentLogs.map(l => `- ${l.category}: ${Number(l.total_hours).toFixed(1)}h`).join('\n')
    : '- No activity logged yet.'}

Wasted hours this week: ${Number(wastedHours).toFixed(1)}h
`.trim();

  const groqHistory = history
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content }));

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: COACH_SYSTEM },
      { role: 'user', content: contextBlock },
      ...groqHistory,
      { role: 'user', content: message },
    ],
    temperature: 0.7,
    max_tokens: 512,
  });

  return completion.choices[0]?.message?.content?.trim() || "Let's dig into your goals. What's on your mind?";
}
