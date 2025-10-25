import dayjs from 'dayjs';
import { calendarForUser } from '../config/google.js';

// Query free/busy for a range and return free slots
export async function getFreeSlots(tokens, calendarId, rangeStart, rangeEnd, slotMinutes = 30) {
  const cal = await calendarForUser(tokens);
  const fb = await cal.freebusy.query({
    requestBody: {
      timeMin: rangeStart,
      timeMax: rangeEnd,
      items: [{ id: calendarId }],
    },
  });
  const busy = fb.data.calendars[calendarId]?.busy || [];
  // Convert busy windows → free slot list of [start,end] ISO strings
  const dayStart = dayjs(rangeStart);
  const dayEnd   = dayjs(rangeEnd);
  const blocks = [[dayStart.toISOString(), dayEnd.toISOString()]];
  // subtract busy intervals
  for (const b of busy) {
    const bStart = dayjs(b.start);
    const bEnd   = dayjs(b.end);
    const next = [];
    for (const [s,e] of blocks) {
      const S = dayjs(s), E = dayjs(e);
      if (bEnd <= S || bStart >= E) { next.push([s,e]); continue; }
      if (bStart > S) next.push([S.toISOString(), bStart.toISOString()]);
      if (bEnd   < E) next.push([bEnd.toISOString(), E.toISOString()]);
    }
    blocks.splice(0, blocks.length, ...next);
  }
  // chunk free blocks into slot-sized slices
  const slots = [];
  for (const [s,e] of blocks) {
    let cur = dayjs(s);
    const end = dayjs(e);
    while (cur.add(slotMinutes, 'minute') <= end) {
      slots.push([cur.toISOString(), cur.add(slotMinutes, 'minute').toISOString()]);
      cur = cur.add(slotMinutes, 'minute');
    }
  }
  return slots;
}

// Create an event on the user's calendar (optionally link to a task)
export async function createCalendarEvent(tokens, calendarId, { title, startISO, endISO, location, attendees }) {
  const cal = await calendarForUser(tokens);
  const res = await cal.events.insert({
    calendarId,
    requestBody: {
      summary: title,
      start: { dateTime: startISO },
      end:   { dateTime: endISO },
      location,
      attendees: (attendees || []).map(email => ({ email })),
    },
  });
  return res.data; // includes id, htmlLink, etc.
}
