import type { MeetingType } from "./meeting-types.js";
import { addDays, localTimeToUtc, moscowDate, moscowParts } from "./scheduling.js";

export type Booking = {
  id: string;
  meetingTypeId: string;
  guestName: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type BookingError = {
  code:
    | "INVALID_GUEST_NAME"
    | "INVALID_MEETING_TYPE_ID"
    | "INVALID_STARTS_AT"
    | "START_NOT_IN_FUTURE"
    | "START_OUTSIDE_WINDOW"
    | "NON_WORKING_TIME"
    | "SLOT_UNAVAILABLE"
    | "MEETING_TYPE_NOT_FOUND";
  message: string;
};

const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function error(code: BookingError["code"], message: string): { error: BookingError } {
  return { error: { code, message } };
}

export function createBookingRepository(
  meetingTypeById: (id: string) => MeetingType | undefined,
  now: () => Date,
  initialBookings: Booking[] = [],
) {
  const bookings = initialBookings;
  let nextId = bookings.length + 1;

  return {
    list: () => bookings,
    upcoming: () =>
      bookings
        .filter((booking) => Date.parse(booking.startsAt) > now().getTime())
        .map((booking) => ({
          ...booking,
          startsAt: new Date(booking.startsAt).toISOString(),
          endsAt: new Date(booking.endsAt).toISOString(),
          createdAt: new Date(booking.createdAt).toISOString(),
        }))
        .sort(
          (a, b) =>
            Date.parse(a.startsAt) - Date.parse(b.startsAt) ||
            Date.parse(a.endsAt) - Date.parse(b.endsAt),
        ),
    create(input: unknown): { booking: Booking } | { error: BookingError } {
      const body = typeof input === "object" && input !== null ? input : {};
      const { meetingTypeId, startsAt, guestName } = body as Record<string, unknown>;
      if (typeof meetingTypeId !== "string")
        return error("INVALID_MEETING_TYPE_ID", "Укажите корректный тип встречи.");
      const meetingType = meetingTypeById(meetingTypeId);
      if (!meetingType) return error("MEETING_TYPE_NOT_FOUND", "Тип встречи не найден.");
      if (typeof guestName !== "string" || guestName.trim() === "") {
        return error("INVALID_GUEST_NAME", "Введите имя гостя.");
      }
      if (typeof startsAt !== "string" || !timestampPattern.test(startsAt)) {
        return error("INVALID_STARTS_AT", "Время начала должно быть UTC timestamp.");
      }
      const start = new Date(startsAt);
      if (Number.isNaN(start.getTime()))
        return error("INVALID_STARTS_AT", "Укажите корректное время начала.");
      if (start.getUTCSeconds() !== 0)
        return error("NON_WORKING_TIME", "Начало должно быть ровно на минутной границе.");
      const current = now();
      if (start <= current)
        return error("START_NOT_IN_FUTURE", "Время начала должно быть в будущем.");

      const local = moscowParts(start);
      const date = `${local.year}-${local.month}-${local.day}`;
      const today = moscowDate(current);
      if (date < today || date > addDays(today, 13)) {
        return error(
          "START_OUTSIDE_WINDOW",
          "Дата должна находиться внутри текущего 14-дневного окна.",
        );
      }
      const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
      const minute = Number(local.minute);
      const hour = Number(local.hour);
      if (weekday === 0 || weekday === 6 || hour < 9 || hour >= 18 || minute % 30 !== 0) {
        return error("NON_WORKING_TIME", "Выберите рабочее время на сетке в 30 минут.");
      }
      const end = new Date(start.getTime() + meetingType.durationMinutes * 60_000);
      const boundary = localTimeToUtc(date, 18, 0);
      if (end > boundary) {
        return error("NON_WORKING_TIME", "Встреча должна полностью помещаться в рабочие часы.");
      }

      // This synchronous section is the check-and-create critical operation.
      if (
        bookings.some(
          (booking) =>
            start.getTime() < Date.parse(booking.endsAt) &&
            end.getTime() > Date.parse(booking.startsAt),
        )
      ) {
        return error(
          "SLOT_UNAVAILABLE",
          "Выбранное время уже занято. Выберите другой свободный слот.",
        );
      }
      const booking = {
        id: `booking_${nextId++}`,
        meetingTypeId,
        guestName: guestName.trim(),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        createdAt: current.toISOString(),
      };
      bookings.push(booking);
      return { booking };
    },
  };
}

export function normalizeAvailableStart(
  date: string,
  hour: number,
  minute: number,
  durationMinutes: number,
) {
  const start = localTimeToUtc(date, hour, minute);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}
