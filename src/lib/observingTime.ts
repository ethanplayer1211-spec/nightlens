export interface ZonedClock { date: string; time: string; label: string; offsetMinutes: number }

export function validTimeZone(value: string): boolean {
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return true; } catch { return false; }
}

export function zonedClock(instant: Date, timeZone: string): ZonedClock {
  if (!Number.isFinite(instant.getTime()) || !validTimeZone(timeZone)) throw new RangeError('Invalid observing instant or timezone');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(instant);
  const fields = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const date = `${fields.year}-${fields.month}-${fields.day}`;
  const time = `${fields.hour}:${fields.minute}`;
  const offsetMinutes = Math.round((Date.parse(`${date}T${time}:${fields.second}Z`) - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
  const sign = offsetMinutes < 0 ? '−' : '+';
  const abs = Math.abs(offsetMinutes);
  return { date, time, offsetMinutes, label: `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}` };
}

/** Reject nonexistent DST times. For a repeated hour, choose the first occurrence and report it. */
export function resolveLocalDateTime(value: string, timeZone: string): { date: Date; ambiguous: boolean } {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !validTimeZone(timeZone)) throw new RangeError('Enter a valid local date and time');
  const naive = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(naive) || new Date(naive).toISOString().slice(0, 16) !== value) throw new RangeError('Invalid calendar date or time');
  if (value < '2001-01-01T00:00' || value > '2100-12-31T23:59') throw new RangeError('Choose a date from 2001 through 2100');
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) offsets.add(zonedClock(new Date(naive + hours * 3600000), timeZone).offsetMinutes);
  const candidates = [...offsets].map(offset => new Date(naive - offset * 60000)).filter(date => { const local = zonedClock(date, timeZone); return `${local.date}T${local.time}` === value; }).sort((a, b) => a.getTime() - b.getTime());
  if (!candidates.length) throw new RangeError('That local time does not exist because clocks change. Choose another time.');
  return { date: candidates[0], ambiguous: candidates.length > 1 };
}

export function shiftInstant(instant: Date, minutes: number): Date {
  if (!Number.isFinite(instant.getTime()) || !Number.isFinite(minutes)) throw new RangeError('Invalid time shift');
  return new Date(instant.getTime() + minutes * 60000);
}

/** Some timezones skip midnight when DST starts, so find the first real hour. */
export function startOfLocalDay(day: string, timeZone: string): Date {
  for (let hour = 0; hour < 6; hour++) {
    try { return resolveLocalDateTime(`${day}T${String(hour).padStart(2, '0')}:00`, timeZone).date; } catch { /* Try the next real local hour. */ }
  }
  throw new RangeError('That local calendar day is unavailable in this timezone');
}
