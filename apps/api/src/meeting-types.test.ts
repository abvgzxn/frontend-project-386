import { afterEach, describe, expect, it } from "vitest";
import { buildApp, type MeetingType } from "./app.js";

describe("GET /api/meeting-types", () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it("returns the meeting type catalog over real HTTP", async () => {
    const meetingTypes: MeetingType[] = [
      {
        id: "mt_intro",
        name: "Знакомство",
        description: "Короткий вводный звонок",
        durationMinutes: 30,
      },
    ];
    const app = buildApp({ meetingTypes });
    apps.push(app);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    if (!address || typeof address === "string") throw new Error("No TCP address");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/meeting-types`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ meetingTypes });
  });
});
