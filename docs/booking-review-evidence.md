# Booking Review Evidence

## #20 sensitivity experiment

Rule under test: a booking must reject any interval that partially overlaps an
existing booking, including across different meeting types. A 60-minute
booking at 10:00 and a 30-minute booking at 10:30 cannot both be created.

Protected API test command:

```sh
npm run test --workspace @call-calendar/api -- src/bookings.test.ts -t "partial overlap"
```

With the correct implementation, the test passed with exit code `0`: the
60-minute booking at 10:00 returned `201`, the second 30-minute booking at
10:30 returned `409 SLOT_UNAVAILABLE`, and the adjacent booking at 11:00
returned `201`.

Mutation in a separate working copy: replace
`start < existingEnd && end > existingStart` with
`start === existingStart` (checking only equal `startsAt`). The same command
then failed with exit code `1`: the partial-overlap assertion expected `409`
but received `201`. This is the intended failure of the protecting test.

The predicate was restored to `start < existingEnd && end > existingStart`.
The same command passed again with exit code `0`, including the
60-minute/30-minute cross-type partial-overlap regression. `mise run check`
then passed with API tests, frontend tests, real-server E2E, lint, typecheck,
and builds. Broken code was not retained or committed.

Comment-ready record: `#20 sensitivity: correct test exit 0; temporary
only-startsAt mutation caused exit 1 because the second 10:30 booking returned
201 instead of expected 409; restored predicate returned exit 0; mise run check
also passed. No broken mutation was committed.`
