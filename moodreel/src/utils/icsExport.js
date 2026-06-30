/**
 * Generate and trigger a download of an ICS (iCalendar) file
 * so a user can add a "watch this vibe" event to their calendar.
 *
 * Usage:
 *   downloadVibeIcs({
 *     title: 'Cozy Sunday — MoodReel vibe',
 *     startAt: Date,          // when to watch
 *     durationMinutes: 120,
 *     description: 'Open MoodReel to see the picks.',
 *     url: 'https://moodreel.app/',
 *   });
 */

function escapeIcs(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatIcsDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const pad = n => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

export function buildVibeIcs({
  title = 'MoodReel vibe',
  startAt = new Date(),
  durationMinutes = 120,
  description = '',
  url = '',
}) {
  const start = formatIcsDate(startAt);
  if (!start) return '';
  const end = formatIcsDate(new Date(startAt.getTime() + durationMinutes * 60 * 1000));
  const now = formatIcsDate(new Date());
  const stamp = `moodreel-${now}-${Math.random().toString(36).slice(2, 8)}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MoodReel//Vibe Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${stamp}@moodreel.app`,
    `DTSTAMP:${now}Z`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `URL:${escapeIcs(url)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadVibeIcs(options) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const ics = buildVibeIcs(options);
  if (!ics) return;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safe = (options.title || 'moodreel-vibe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  a.download = `${safe || 'moodreel-vibe'}.ics`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default { buildVibeIcs, downloadVibeIcs };
