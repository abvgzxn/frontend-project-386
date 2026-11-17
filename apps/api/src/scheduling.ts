const timeZone = "Europe/Moscow";

export function bookingStartStepMinutes(durationMinutes: number) {
  return durationMinutes > 30 ? 60 : 30;
}

export function moscowParts(date: Date) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return values;
}

export function moscowDate(date: Date) {
  const value = moscowParts(date);
  return `${value.year}-${value.month}-${value.day}`;
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function offsetAt(date: Date) {
  const value = moscowParts(date);
  const asUtc = Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
    Number(value.hour),
    Number(value.minute),
    Number(value.second),
  );
  return asUtc - date.getTime();
}

export function localTimeToUtc(date: string, hour: number, minute: number) {
  const local = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8)),
    hour,
    minute,
  );
  return new Date(local - offsetAt(new Date(local)));
}
