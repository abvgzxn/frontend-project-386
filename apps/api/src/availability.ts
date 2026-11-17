import type { MeetingType } from "./meeting-types.js";
import type { Booking } from "./bookings.js";
import { addDays, bookingStartStepMinutes, localTimeToUtc, moscowDate } from "./scheduling.js";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type AvailabilityError =
  | { code: "INVALID_DATE" | "DATE_RANGE_OUTSIDE_WINDOW"; message: string }
  | { code: "MEETING_TYPE_NOT_FOUND"; message: string };

export type AvailableStart = { startsAt: string; endsAt: string };

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
  | { meetingTypeId: string; from: string; to: string; slots: AvailableStart[] }
  | { error: AvailabilityError } {
  if (!meetingType) {
    return { error: { code: "MEETING_TYPE_NOT_FOUND", message: "Тип встречи не найден." } };
  }
  if (!from || !to || !isValidDate(from) || !isValidDate(to)) {
    return { error: { code: "INVALID_DATE", message: "Укажите даты в формате YYYY-MM-DD." } };
  }

  const windowFrom = moscowDate(now);
  const windowTo = addDays(windowFrom, 13);
  if (from > to || from < windowFrom || to > windowTo) {
    return {
      error: {
        code: "DATE_RANGE_OUTSIDE_WINDOW",
        message: "Диапазон должен находиться внутри текущего 14-дневного окна.",
      },
    };
  }

  const availableStarts: AvailableStart[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (
      let minutes = 9 * 60;
      minutes < 18 * 60;
      minutes += bookingStartStepMinutes(meetingType.durationMinutes)
    ) {
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
        availableStarts.push({ startsAt, endsAt });
      }
    }
  }

  return { meetingTypeId: meetingType.id, from, to, slots: availableStarts };
}
