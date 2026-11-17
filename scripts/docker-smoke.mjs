const baseUrl = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    data = body;
  }
  return { response, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let health;
for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    health = await request("/api/health");
    if (health.response.ok) break;
  } catch {
    // The container may still be starting.
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}
assert(health, "container did not become ready");
assert(health.response.ok && health.data.status === "ok", "health check failed");

for (const path of ["/", "/book", "/owner", "/owner/bookings"]) {
  const page = await request(path);
  assert(
    page.response.ok && typeof page.data === "string" && page.data.includes("<html"),
    `${path} failed`,
  );
}

const unknownApi = await request("/api/not-found");
assert(
  unknownApi.response.status === 404 && unknownApi.data.code === "NOT_FOUND",
  "unknown API route failed",
);

const created = await request("/api/meeting-types", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "Smoke call",
    description: "Container smoke test",
    durationMinutes: 30,
  }),
});
assert(created.response.status === 201, "meeting type creation failed");

const meetingTypeId = created.data.meetingType.id;
const candidate = new Date(Date.now() + 24 * 60 * 60 * 1000);
while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
  candidate.setUTCDate(candidate.getUTCDate() + 1);
}
candidate.setUTCHours(7, 0, 0, 0);
const startsAt = candidate.toISOString();
const booking = await request("/api/bookings", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ meetingTypeId, startsAt, guestName: "Smoke guest" }),
});
assert(booking.response.status === 201, "booking creation failed");

const conflict = await request("/api/bookings", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ meetingTypeId, startsAt, guestName: "Second guest" }),
});
assert(
  conflict.response.status === 409 && conflict.data.code === "SLOT_UNAVAILABLE",
  "booking conflict failed",
);

console.log("Docker smoke test passed");
