// Turns an iCal feed (Google Calendar's "secret address in iCal format") into a simple list of
// events between two times, expanding repeating events and their one-off changes.
// Plain JavaScript with no imports so it runs in the Supabase Edge Function (Deno) and in Node tests.
export function expandEvents(ICAL, icsText, from, to) {
  // Full calendars hold years of history; parsing all of it blew the function's memory limit.
  // Skim the text first and only fully parse events that could land in the window.
  const root = new ICAL.Component(ICAL.parse(prefilterIcs(icsText, from, to)));

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

  // Stepping a years-old daily series one day at a time is too slow for the function's time limit,
  // so move the start of daily/weekly series forward by whole periods to about two weeks before
  // the window. Times of day and weekdays stay the same, so the occurrences we care about don't change.
  const DAY = 86400000;
  const early = from.getTime() - 14 * DAY;
  function fastForward(ev) {
    const rule = ev.component.getFirstPropertyValue("rrule");
    if (!rule || rule.count || (rule.freq !== "DAILY" && rule.freq !== "WEEKLY")) return;
    const period = (rule.freq === "DAILY" ? 1 : 7) * (rule.interval || 1);
    const behind = Math.floor((early - ev.startDate.toJSDate().getTime()) / DAY / period);
    if (behind < 1) return;
    const days = behind * period;
    const start = ev.startDate.clone();
    start.adjust(days, 0, 0, 0);
    if (ev.component.hasProperty("dtend")) {
      const end = ev.endDate.clone();
      end.adjust(days, 0, 0, 0);
      ev.endDate = end;
    }
    ev.startDate = start;
  }

  masters.forEach(ev => {
    if (!ev.isRecurring()) return add(ev, ev.startDate, ev.endDate);
    fastForward(ev);
    const it = ev.iterator();
    let next, guard = 0;
    while ((next = it.next()) && guard++ < 50000) {
      const t = next.toJSDate().getTime();
      if (t > to.getTime()) break;
      if (t < early) continue;
      const d = ev.getOccurrenceDetails(next);
      add(d.item, d.startDate, d.endDate);
    }
  });

  out.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  return out;
}

// Keep the calendar's time zones plus only the events that might matter between `from` and `to`:
// one-off events (and changes to repeating ones) dated within a couple of days of the window, and
// repeating events that haven't ended before it. Everything else is dropped as plain text.
export function prefilterIcs(icsText, from, to) {
  const text = icsText.replace(/\r?\n[ \t]/g, ""); // unfold long lines
  const DAY = 86400000;
  const key = d => d.toISOString().slice(0, 10).replace(/-/g, "");
  const lo = key(new Date(from.getTime() - 2 * DAY)), hi = key(new Date(to.getTime() + 2 * DAY));
  // First 8 digits of a property's value: DTSTART;TZID=X:20261012T093000 -> "20261012"
  const dateOf = (block, name) => {
    const m = block.match(new RegExp("\\n" + name + "[;:][^\\n]*?(\\d{8})"));
    return m ? m[1] : null;
  };

  const parts = text.split("BEGIN:VEVENT");
  const head = parts[0];
  const timezones = [];
  head.replace(/BEGIN:VTIMEZONE[\s\S]*?END:VTIMEZONE/g, tz => { timezones.push(tz); return tz; });

  const keep = [];
  for (let i = 1; i < parts.length; i++) {
    const end = parts[i].indexOf("END:VEVENT");
    if (end < 0) continue;
    const raw = parts[i].slice(0, end);
    const block = "\n" + raw; // leading newline so "\nDTSTART" matches the first property too
    if (/\nRRULE[;:]/.test(block) || /\nRDATE[;:]/.test(block)) {
      const until = block.match(/\nRRULE[;:][^\n]*UNTIL=(\d{8})/);
      if (until && until[1] < lo) continue; // series ended before the window
      keep.push(raw);
      continue;
    }
    const start = dateOf(block, "DTSTART");
    const finish = dateOf(block, "DTEND") || start;
    const original = dateOf(block, "RECURRENCE-ID");
    const near = start && start <= hi && finish >= lo;
    if (near || (original && original >= lo && original <= hi)) keep.push(raw);
  }

  return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\n" + timezones.join("\r\n") + "\r\n" +
    keep.map(b => "BEGIN:VEVENT" + b + "END:VEVENT").join("\r\n") + "\r\nEND:VCALENDAR\r\n";
}
