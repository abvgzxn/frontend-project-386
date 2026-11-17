# Browser Evidence

The repository E2E check runs `e2e/booking.spec.ts` against a fresh Fastify
process and a fresh Vite process. The API port and Vite port are selected at
runtime, and the Vite proxy target is passed through `API_PROXY_TARGET`.

The test creates a uniquely named meeting type through `/owner`, selects the
first dynamically available weekday on `/book`, completes a booking, and
checks `/owner/bookings`. It then occupies another available slot through a
real HTTP request, submits that stale slot from the browser, and verifies the
real `409 SLOT_UNAVAILABLE` recovery: the type, date, and guest name remain;
the selected start is cleared; availability refreshes; and a second submit
does not send the stale start.

Run locally with:

```sh
npx playwright install chromium
npm run test:e2e
```

`mise run check` includes this browser scenario after the API/frontend tests.
CI installs Chromium with system dependencies before running that gate.
