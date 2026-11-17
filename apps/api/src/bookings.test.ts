import { afterEach, describe, expect, it } from "vitest";
import { buildApp, type MeetingType } from "./app.js";

const now = new Date("2026-06-05T08:00:00.000Z");
const meetingTypes: MeetingType[] = [
  { id: "mt_long", name: "Час", description: "Часовой звонок", durationMinutes: 60 },
  { id: "mt_short", name: "Полчаса", description: "Короткий звонок", durationMinutes: 30 },
];

describe("POST /api/bookings", () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  async function server() {
    const app = buildApp({ meetingTypes, now: () => now });
    apps.push(app);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    if (!address || typeof address === "string") throw new Error("No TCP address");
    return `http://127.0.0.1:${address.port}`;
  }

  async function post(url: string, body: unknown) {
    return fetch(`${url}/api/bookings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("creates a trimmed booking and computes normalized UTC end and creation timestamps", async () => {
    const url = await server();
    const response = await post(url, {
      meetingTypeId: "mt_short",
      startsAt: "2026-06-08T07:30:00.1Z",
      guestName: "  Анна  ",
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      booking: {
        id: expect.stringMatching(/^booking_/),
        meetingTypeId: "mt_short",
        guestName: "Анна",
        startsAt: "2026-06-08T07:30:00.100Z",
        endsAt: "2026-06-08T08:00:00.100Z",
        createdAt: "2026-06-05T08:00:00.000Z",
      },
    });
  });

  it.each([
    [
      { meetingTypeId: "missing", startsAt: "2026-06-08T07:00:00Z", guestName: "Анна" },
      404,
      "MEETING_TYPE_NOT_FOUND",
    ],
    [
      { meetingTypeId: "mt_short", startsAt: "2026-06-08T07:00:00+03:00", guestName: "Анна" },
      400,
      "INVALID_STARTS_AT",
    ],
    [
      { meetingTypeId: "mt_short", startsAt: "not-a-time", guestName: "Анна" },
      400,
      "INVALID_STARTS_AT",
    ],
    [
      { meetingTypeId: "mt_short", startsAt: "2026-06-08T07:00:00Z", guestName: "   " },
      400,
      "INVALID_GUEST_NAME",
    ],
    [
      { meetingTypeId: "mt_short", startsAt: "2026-06-08T07:15:00Z", guestName: "Анна" },
      400,
      "NON_WORKING_TIME",
    ],
    [
      { meetingTypeId: "mt_short", startsAt: "2026-06-05T07:00:00Z", guestName: "Анна" },
      400,
      "START_NOT_IN_FUTURE",
    ],
  ])("rejects invalid request %#", async (body, status, code) => {
    const response = await post(await server(), body);
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ code, message: expect.any(String) });
  });

  it("rejects partial overlap across meeting types while allowing exact adjacency", async () => {
    const url = await server();
    expect(
      (
        await post(url, {
          meetingTypeId: "mt_long",
          startsAt: "2026-06-08T07:00:00Z",
          guestName: "А",
        })
      ).status,
    ).toBe(201);

    const partial = await post(url, {
      meetingTypeId: "mt_short",
      startsAt: "2026-06-08T07:30:00Z",
      guestName: "Б",
    });
    expect(partial.status).toBe(409);
    expect(await partial.json()).toEqual({ code: "SLOT_UNAVAILABLE", message: expect.any(String) });

    const adjacent = await post(url, {
      meetingTypeId: "mt_short",
      startsAt: "2026-06-08T08:00:00Z",
      guestName: "В",
    });
    expect(adjacent.status).toBe(201);
  });

  it.each([
    ["nested", "mt_short", "2026-06-08T07:00:00Z", "mt_long", "2026-06-08T07:00:00Z"],
    ["equal", "mt_short", "2026-06-08T09:00:00Z", "mt_short", "2026-06-08T09:00:00Z"],
  ])("rejects %s intervals", async (_name, firstType, firstStart, secondType, secondStart) => {
    const url = await server();
    expect(
      (await post(url, { meetingTypeId: firstType, startsAt: firstStart, guestName: "А" })).status,
    ).toBe(201);
    const response = await post(url, {
      meetingTypeId: secondType,
      startsAt: secondStart,
      guestName: "Б",
    });
    expect(response.status).toBe(409);
  });

  it("atomically accepts exactly one of concurrent conflicting requests", async () => {
    const url = await server();
    const responses = await Promise.all(
      ["А", "Б"].map((guestName) =>
        post(url, { meetingTypeId: "mt_short", startsAt: "2026-06-08T10:00:00Z", guestName }),
      ),
    );
    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 409)).toHaveLength(1);
  });

  it("removes a booking from availability for every meeting type", async () => {
    const url = await server();
    expect(
      (
        await post(url, {
          meetingTypeId: "mt_long",
          startsAt: "2026-06-08T07:00:00Z",
          guestName: "А",
        })
      ).status,
    ).toBe(201);
    const response = await fetch(
      `${url}/api/meeting-types/mt_short/availability?from=2026-06-08&to=2026-06-08`,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { slots: { startsAt: string }[] };
    expect(body.slots.some((slot) => slot.startsAt === "2026-06-08T07:00:00.000Z")).toBe(false);
    expect(body.slots.some((slot) => slot.startsAt === "2026-06-08T08:00:00.000Z")).toBe(true);
  });
});
