# Booking Review Evidence

## #20 sensitivity experiment

Rule under test: a booking must reject any interval whose end is after the
exact `18:00:00.000` Europe/Moscow boundary, while preserving the accepted UTC
timestamp rule (`Z` with no fraction or 1-3 fractional digits).

Exact command used for the deliberate mutation:

```sh
npm run test --workspace @call-calendar/api -- src/bookings.test.ts
```

Red result: the command failed because the temporary mutation kept the old
hour/minute-only boundary check; `2026-06-08T14:30:00.001Z` was accepted even
though its end was `18:00:00.001` in Moscow.

The mutation was restored to the strict boundary comparison. The same command
then passed, including the fractional-boundary regression tests. Broken code
was not retained.

Comment-ready record: `#20 sensitivity: deliberately retained the exact
command, red reason, and restored-green result above. The strict Moscow
18:00:00.000 rule is now covered by regression tests; no broken mutation
remains.`
