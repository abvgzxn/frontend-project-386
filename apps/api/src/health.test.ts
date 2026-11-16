import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("GET /api/health", () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it("returns the health status over real HTTP", async () => {
    const app = buildApp();
    apps.push(app);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    if (!address || typeof address === "string") throw new Error("No TCP address");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
