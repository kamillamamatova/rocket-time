import 'dotenv/config';
import Groq from 'groq-sdk';

const SYSTEM = `
You are a time-management assistant.
Respond ONLY with a valid JSON object.

Classify user messages into one of:
["CREATE_EVENT","ADD_TASK","PLAN_WEEK","PRIORITIZE","ASK_FEEDBACK","SMALL_TALK"].

When intent = "CREATE_EVENT", extract:
{
  "intent": "CREATE_EVENT",
  "event": {
    "title": "...",        // concise, <= 80 chars
    "date": "YYYY-MM-DD",  // absolute date
    "startTime": "HH:MM",  // 24-hour
    "endTime": "HH:MM",    // optional
    "durationMins": 60,    // integer, use if endTime missing
    "location": "...",     // optional
    "description": "..."   // optional
  }
}

When intent = "ADD_TASK", extract:
{
  "intent": "ADD_TASK",
  "task": {
    "title": "...",
    "estMinutes": 60,      // optional integer
    "deadline": "YYYY-MM-DD" // optional
  }
}

For all other intents just return: { "intent": "<INTENT>" }

RULES:
- Return ONLY valid JSON, no markdown, no explanation.
- Dates must be absolute YYYY-MM-DD, never relative.
- Times must be 24-hour HH:MM.
`;

export async function parseUserMessage(message, userProfile) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const client = new Groq({ apiKey });

  const completion = await client.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `User goals: ${JSON.stringify(userProfile?.goals ?? [])}\nMessage: """${message}"""`,
      },
    ],
    temperature: 0,
    max_tokens: 512,
    response_format: { type: 'json_object' },
  });

  const txt = completion.choices[0]?.message?.content || '{"intent":"SMALL_TALK"}';
  try {
    return JSON.parse(txt);
  } catch {
    return { intent: 'SMALL_TALK' };
  }
}
