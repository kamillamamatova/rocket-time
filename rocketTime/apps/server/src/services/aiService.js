//creating a google ai adk agent that will autamte tasks and create events on google calendar using the api

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
// ⬇️ import the JSON schema
import ParseSchema from '../schemas/parse.schema.js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM = `
You are a time-management assistant.
Classify user messages into: ["CREATE_EVENT","ADD_TASK","PLAN_WEEK","PRIORITIZE","ASK_FEEDBACK","SMALL_TALK"].
Extract fields when relevant:
- event: {title, date?, startTime?, endTime?, durationMins?, location?, attendees[]}
- task: {title, estMinutes?, deadline?}
- preferences: {workingHours:{start,end}, timezone}
Return ONLY JSON matching the schema.
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
