//creating a google ai adk agent that will autamte tasks and create events on google calendar using the api

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
// ⬇️ import the JSON schema
import ParseSchema from '../schemas/parse.schema.js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM = `
You are a time-management assistant.
Return ONLY JSON that matches the provided schema.

Classify user messages into one of:
["CREATE_EVENT","ADD_TASK","PLAN_WEEK","PRIORITIZE","ASK_FEEDBACK","SMALL_TALK"].

When intent = "CREATE_EVENT", extract:
event: {
  title,               // REQUIRED, concise (<= 80 chars), single sentence
  date,                // REQUIRED, YYYY-MM-DD (resolve "tomorrow", "next Wed", etc.)
  startTime,           // REQUIRED, HH:MM (24-hour)
  endTime?,            // HH:MM (24-hour) OR
  durationMins?,       // integer minutes (use if endTime is missing)
  location?,           // optional short string
  attendees?,          // optional list of emails
  description?         // optional, <= 800 chars, multiline allowed
}

STRICT RULES:
- NEVER copy the user’s entire message into "title".
- "title" must summarize the event in <= 80 characters, no trailing punctuation spam.
- If the user includes long text, put it in "description" (<= 800 chars) instead.
- Always include "date" and "startTime". If no duration is given, set "durationMins": 60.
- Dates must be absolute (YYYY-MM-DD), not relative.
- Times must be 24-hour HH:MM.

Example:
User: "Create a meeting tomorrow at 3 PM for 2 hours in the conference room"
Response:
{
  "intent": "CREATE_EVENT",
  "event": {
    "title": "Team meeting",
    "date": "2024-12-20",
    "startTime": "15:00",
    "durationMins": 120,
    "location": "Conference room",
    "description": ""
  }
}
`;

export async function parseUserMessage(message, userProfile) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const contents = `${SYSTEM}
User goals: ${JSON.stringify(userProfile?.goals ?? [])}
Message: """${message}"""`;

  const resp = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: contents }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: ParseSchema              // ⬅️ using the external JSON
    }
  });

  const txt = resp.response.text() || '{"intent":"SMALL_TALK"}';
  try { return JSON.parse(txt); } catch { return { intent: 'SMALL_TALK' }; }
}
