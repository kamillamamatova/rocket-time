//creating a google adk agent that will autamte tasks and create events on google calendar using the api
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// System prompt to keep the agent on-task (classification + structured extraction)
const SYSTEM = `
You are a time-management assistant.
Classify user messages into one of: ["CREATE_EVENT","ADD_TASK","PLAN_WEEK","PRIORITIZE","ASK_FEEDBACK","SMALL_TALK"].
When relevant, extract fields as JSON:
- event: {title, date?, startTime?, endTime?, durationMins?, location?, attendees[]}
- task: {title, estMinutes?, deadline?}
- preferences: {workingHours:{start,end}, timezone}
Return strictly JSON: {"intent":"...","event":{...},"task":{...}} (omit unused keys).
`;

export async function parseUserMessage(message, userProfile) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const input = `${SYSTEM}
User goals: ${JSON.stringify(userProfile?.goals ?? [])}
Message: """${message}"""`;

  const res = await model.generateContent(input);
  // Be defensive: try JSON parse; fallback to best-effort extraction.
  const text = res.response.text().trim();
  try {
    return JSON.parse(text);
  } catch {
    return { intent: 'SMALL_TALK' };
  }
}

export async function summarizeFeedback(context) {
  // Produce succinct feedback comparing an event/schedule to user goals.
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `
Given:
- Goals: ${JSON.stringify(context.goals)}
- Event: ${JSON.stringify(context.event)}
- Task (if any): ${JSON.stringify(context.task)}
Explain in 2-3 bullets how this supports goals, and one improvement suggestion.`;
  const res = await model.generateContent(prompt);
  return res.response.text();
}
