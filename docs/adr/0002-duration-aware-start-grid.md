# ADR 0002: Duration-Aware Booking Start Grid

## Status

Accepted

## Context

The calendar has a single owner's working window from 09:00 through 18:00 in
`Europe/Moscow`. The previous implementation offered every meeting type on a
30-minute start grid. That made 45- and 60-minute meetings appear at starts
that do not match the intended hourly presentation.

Availability and direct booking requests must use the same start-grid rule. A
booking's occupied interval must remain its actual `[startsAt, endsAt)`
interval, not a rounded hour.

## Decision

- 30-minute meetings may start every 30 minutes: 09:00, 09:30, 10:00, and so on.
- Meetings longer than 30 minutes use an hourly start grid: 09:00, 10:00, 11:00, and so on.
- The end instant is calculated from the meeting type's exact duration. A 45-minute meeting remains 45 minutes.
- Availability excludes only intervals that overlap the candidate interval. Exact adjacency is allowed, so a 15:00–15:30 booking leaves 15:30–16:00 available, while a 15:00–16:00 booking overlaps a 15:00 start.
- The same grid and interval rules are enforced by `GET /api/meeting-types/:id/availability` and `POST /api/bookings`.

## Consequences

- The public API rejects direct starts that are not on the duration-appropriate grid.
- Availability and booking validation cannot disagree about valid starts.
- The 45-minute duration is preserved even though its starts are hourly.
