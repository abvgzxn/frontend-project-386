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

describe("POST /api/meeting-types", () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  async function postMeetingType(body: unknown) {
    const app = buildApp();
    apps.push(app);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    if (!address || typeof address === "string") throw new Error("No TCP address");
    const url = `http://127.0.0.1:${address.port}`;
    return {
      app,
      url,
      response: await fetch(`${url}/api/meeting-types`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    };
  }

  it("creates a trimmed meeting type and updates the catalog", async () => {
    const { response, url } = await postMeetingType({
      name: "  Знакомство  ",
      description: "  Короткий вводный звонок  ",
      durationMinutes: 30,
    });

    expect(response.status).toBe(201);
    const created = await response.json();
    expect(created.meetingType).toMatchObject({
      id: expect.stringMatching(/^mt_/),
      name: "Знакомство",
      description: "Короткий вводный звонок",
      durationMinutes: 30,
    });
    expect(await (await fetch(`${url}/api/meeting-types`)).json()).toEqual({
      meetingTypes: [created.meetingType],
    });
  });

  it.each([
    [{ name: "   ", description: "Описание", durationMinutes: 30 }, "INVALID_NAME"],
    [{ name: "Название", description: "   ", durationMinutes: 30 }, "INVALID_DESCRIPTION"],
    [{ name: "Название", description: "Описание", durationMinutes: 0 }, "INVALID_DURATION"],
    [{ name: "Название", description: "Описание", durationMinutes: 1.5 }, "INVALID_DURATION"],
  ])("rejects invalid input with stable error shape", async (body, code) => {
    const { response } = await postMeetingType(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ code, message: expect.any(String) });
  });
});
