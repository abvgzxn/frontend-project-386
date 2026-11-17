import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("GET /api/meeting-types/:id/availability", () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  const now = new Date("2026-06-05T10:15:00.000Z");

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  async function getAvailability(
    path: string,
    meetingTypes = [
      {
        id: "mt_long",
        name: "Глубокий разговор",
        description: "Разговор на полтора часа",
        durationMinutes: 90,
      },
    ],
  ) {
    const app = buildApp({ meetingTypes, now: () => now });
    apps.push(app);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    if (!address || typeof address === "string") throw new Error("No TCP address");
    return fetch(`http://127.0.0.1:${address.port}${path}`);
  }

  it("returns Moscow weekday starts on the inclusive grid and fits the duration", async () => {
    const response = await getAvailability(
      "/api/meeting-types/mt_long/availability?from=2026-06-05&to=2026-06-08",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      meetingTypeId: "mt_long",
      from: "2026-06-05",
      to: "2026-06-08",
      slots: [
        { startsAt: "2026-06-05T11:00:00.000Z", endsAt: "2026-06-05T12:30:00.000Z" },
        { startsAt: "2026-06-05T12:00:00.000Z", endsAt: "2026-06-05T13:30:00.000Z" },
        { startsAt: "2026-06-05T13:00:00.000Z", endsAt: "2026-06-05T14:30:00.000Z" },
        { startsAt: "2026-06-08T06:00:00.000Z", endsAt: "2026-06-08T07:30:00.000Z" },
        { startsAt: "2026-06-08T07:00:00.000Z", endsAt: "2026-06-08T08:30:00.000Z" },
        { startsAt: "2026-06-08T08:00:00.000Z", endsAt: "2026-06-08T09:30:00.000Z" },
        { startsAt: "2026-06-08T09:00:00.000Z", endsAt: "2026-06-08T10:30:00.000Z" },
        { startsAt: "2026-06-08T10:00:00.000Z", endsAt: "2026-06-08T11:30:00.000Z" },
        { startsAt: "2026-06-08T11:00:00.000Z", endsAt: "2026-06-08T12:30:00.000Z" },
        { startsAt: "2026-06-08T12:00:00.000Z", endsAt: "2026-06-08T13:30:00.000Z" },
        { startsAt: "2026-06-08T13:00:00.000Z", endsAt: "2026-06-08T14:30:00.000Z" },
      ],
    });
  });

  it.each([30, 45, 60])(
    "uses the duration-aware start grid for %d-minute meetings",
    async (duration) => {
      const response = await getAvailability(
        "/api/meeting-types/mt_grid/availability?from=2026-06-08&to=2026-06-08",
        [{ id: "mt_grid", name: "Grid", description: "Grid", durationMinutes: duration }],
      );
      const body = (await response.json()) as {
        slots: { startsAt: string; endsAt: string }[];
      };
      const step = duration > 30 ? 60 : 30;
      const expectedStarts = Array.from({ length: duration > 30 ? 9 : 18 }, (_, index) => {
        const minutes = 6 * 60 + index * step;
        return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      });

      expect(body.slots.map(({ startsAt }) => startsAt.slice(11, 16))).toEqual(expectedStarts);
      expect(
        body.slots.every(
          ({ startsAt, endsAt }) => Date.parse(endsAt) - Date.parse(startsAt) === duration * 60_000,
        ),
      ).toBe(true);
    },
  );

  it.each([
    ["2026-06-04", "2026-06-05"],
    ["2026-06-05", "2026-06-04"],
    ["2026-06-05", "2026-06-19"],
  ])("rejects range %s to %s with a stable error", async (from, to) => {
    const response = await getAvailability(
      `/api/meeting-types/mt_long/availability?from=${from}&to=${to}`,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "DATE_RANGE_OUTSIDE_WINDOW",
      message: expect.any(String),
    });
  });

  it("returns stable errors for unknown types and malformed dates", async () => {
    const unknown = await getAvailability(
      "/api/meeting-types/missing/availability?from=2026-06-05&to=2026-06-05",
    );
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual({
      code: "MEETING_TYPE_NOT_FOUND",
      message: expect.any(String),
    });

    const malformed = await getAvailability(
      "/api/meeting-types/mt_long/availability?from=not-a-date&to=2026-06-05",
    );
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ code: "INVALID_DATE", message: expect.any(String) });
  });
});
