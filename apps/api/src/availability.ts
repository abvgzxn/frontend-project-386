import type { MeetingType } from "./meeting-types.js";
import type { Booking } from "./bookings.js";

const timeZone = "Europe/Moscow";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type AvailabilityError =
  | { code: "INVALID_DATE" | "DATE_RANGE_OUTSIDE_WINDOW"; message: string }
  | { code: "MEETING_TYPE_NOT_FOUND"; message: string };

export type AvailabilitySlot = { startsAt: string; endsAt: string };

function dateParts(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function offsetAt(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return asUtc - date.getTime();
}

function localTimeToUtc(date: string, hour: number, minute: number) {
  const local = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8)),
    hour,
    minute,
  );
  return new Date(local - offsetAt(new Date(local)));
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function isValidDate(value: string) {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value;
}

function formatTimestamp(value: Date) {
  return value.toISOString();
}

export function getAvailability(
  meetingType: MeetingType | undefined,
  from: string | undefined,
  to: string | undefined,
  now: Date,
  bookings: Booking[] = [],
):
  | { meetingTypeId: string; from: string; to: string; slots: AvailabilitySlot[] }
  | { error: AvailabilityError } {
  if (!meetingType) {
    return { error: { code: "MEETING_TYPE_NOT_FOUND", message: "Тип встречи не найден." } };
  }
  if (!from || !to || !isValidDate(from) || !isValidDate(to)) {
    return { error: { code: "INVALID_DATE", message: "Укажите даты в формате YYYY-MM-DD." } };
  }

  const windowFrom = dateParts(now);
  const windowTo = addDays(windowFrom, 13);
  if (from > to || from < windowFrom || to > windowTo) {
    return {
      error: {
        code: "DATE_RANGE_OUTSIDE_WINDOW",
        message: "Диапазон должен находиться внутри текущего 14-дневного окна.",
      },
    };
  }

  const slots: AvailabilitySlot[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (let minutes = 9 * 60; minutes < 18 * 60; minutes += 30) {
      const endMinutes = minutes + meetingType.durationMinutes;
      if (endMinutes > 18 * 60) continue;
      const start = localTimeToUtc(date, Math.floor(minutes / 60), minutes % 60);
      const end = localTimeToUtc(date, Math.floor(endMinutes / 60), endMinutes % 60);
      if (start <= now) continue;
      const startsAt = formatTimestamp(start);
      const endsAt = formatTimestamp(end);
      if (
        !bookings.some(
          (booking) => start < new Date(booking.endsAt) && end > new Date(booking.startsAt),
        )
      ) {
        slots.push({ startsAt, endsAt });
      }
    }
  }

  return { meetingTypeId: meetingType.id, from, to, slots };
}
