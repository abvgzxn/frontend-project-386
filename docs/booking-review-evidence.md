# Booking Review Evidence

## #20 sensitivity experiment

Rule under test: a booking must reject any interval that partially overlaps an
existing booking, including across different meeting types. A 60-minute
booking at 10:00 and a 30-minute booking at 10:30 cannot both be created.

Exact command used for the deliberate mutation:

```sh
npm run test --workspace @call-calendar/api -- src/bookings.test.ts -t "partial overlap"
```

Red result: after temporarily changing the overlap predicate from
`start < existingEnd && end > existingStart` to `||`, the command failed
because an adjacent booking was incorrectly rejected with `409` instead of
`201`. The failure identifies the broken interval behavior rather than a
frontend or transport failure.

The predicate was restored to `start < existingEnd && end > existingStart`.
The same command then passed, including the 60-minute/30-minute cross-type
partial-overlap regression. Broken code was not retained.

Comment-ready record: `#20 sensitivity: deliberately retained the exact
command, red reason, and restored-green result above. The strict half-open
interval rule is now covered by regression tests; no broken mutation remains.`
