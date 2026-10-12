// Turns an iCal feed (Google Calendar's "secret address in iCal format") into a simple list of
// events between two times, expanding repeating events and their one-off changes.
// Plain JavaScript with no imports so it runs in the Supabase Edge Function (Deno) and in Node tests.
export function expandEvents(ICAL, icsText, from, to) {
  const root = new ICAL.Component(ICAL.parse(icsText));

  // Register the feed's time zones so "9:00 America/New_York" converts correctly.
  root.getAllSubcomponents("vtimezone").forEach(c => {
    const tz = new ICAL.Timezone(c);
    if (tz.tzid && !ICAL.TimezoneService.has(tz.tzid)) ICAL.TimezoneService.register(tz.tzid, tz);
  });

  // Repeating events come as one "master" plus separate entries for occurrences that were changed.
  const masters = new Map();
  const changed = [];
  root.getAllSubcomponents("vevent").forEach(c => {
    if (c.hasProperty("recurrence-id")) changed.push(c);
    else masters.set(c.getFirstPropertyValue("uid"), new ICAL.Event(c));
  });
  changed.forEach(c => {
    const uid = c.getFirstPropertyValue("uid");
    const master = masters.get(uid);
    if (master && master.isRecurring()) master.relateException(c);
    else masters.set(uid + "#" + c.getFirstPropertyValue("recurrence-id"), new ICAL.Event(c));
  });

  const pad = n => (n < 10 ? "0" : "") + n;
  const dateOnly = t => t.year + "-" + pad(t.month) + "-" + pad(t.day);
  const out = [];
  function add(item, start, end) {
    const status = String(item.component.getFirstPropertyValue("status") || "").toUpperCase();
    if (status === "CANCELLED") return;
    end = end || start;
    const s = start.toJSDate(), e = end.toJSDate();
    if (e < from || s > to) return;
    out.push({
      title: item.summary || "Busy",
      allDay: !!start.isDate,
      start: start.isDate ? dateOnly(start) : s.toISOString(),
      end: end.isDate ? dateOnly(end) : e.toISOString()
    });
  }

  masters.forEach(ev => {
    if (!ev.isRecurring()) return add(ev, ev.startDate, ev.endDate);
    const it = ev.iterator();
    let next, guard = 0;
    while ((next = it.next()) && guard++ < 50000) {
      if (next.toJSDate() > to) break;
      const d = ev.getOccurrenceDetails(next);
      add(d.item, d.startDate, d.endDate);
    }
  });

  out.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  return out;
}
