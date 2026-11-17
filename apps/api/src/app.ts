import Fastify from "fastify";
import { getAvailability } from "./availability.js";
import { createBookingRepository, type Booking } from "./bookings.js";
import { createMeetingTypeRepository, type MeetingType } from "./meeting-types.js";

export type { MeetingType } from "./meeting-types.js";

type AppOptions = {
  meetingTypes?: MeetingType[];
  now?: () => Date;
  bookings?: Booking[];
};

export function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false });
  const meetingTypeRepository = createMeetingTypeRepository(options.meetingTypes);
  const now = options.now ?? (() => new Date());
  const bookingRepository = createBookingRepository(
    (id) => meetingTypeRepository.get(id),
    now,
    options.bookings,
  );

  app.get(
    "/api/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: { status: { type: "string", const: "ok" } },
            required: ["status"],
          },
        },
      },
    },
    async () => ({ status: "ok" as const }),
  );

  app.get(
    "/api/meeting-types",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              meetingTypes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    durationMinutes: { type: "integer" },
                  },
                  required: ["id", "name", "description", "durationMinutes"],
                },
              },
            },
            required: ["meetingTypes"],
          },
        },
      },
    },
    async () => ({ meetingTypes: meetingTypeRepository.list() }),
  );

  app.post<{ Body: unknown }>(
    "/api/meeting-types",
    {
      schema: {
        response: {
          201: {
            type: "object",
            properties: {
              meetingType: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  durationMinutes: { type: "integer", minimum: 1 },
                },
                required: ["id", "name", "description", "durationMinutes"],
              },
            },
            required: ["meetingType"],
          },
          400: {
            type: "object",
            properties: { code: { type: "string" }, message: { type: "string" } },
            required: ["code", "message"],
          },
        },
      },
    },
    async (request, reply) => {
      const result = meetingTypeRepository.create(request.body);
      if ("error" in result) return reply.code(400).send(result.error);
      return reply.code(201).send(result);
    },
  );

  app.get<{ Params: { id: string }; Querystring: { from?: string; to?: string } }>(
    "/api/meeting-types/:id/availability",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              meetingTypeId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
              slots: {
                type: "array",
                items: {
                  type: "object",
                  properties: { startsAt: { type: "string" }, endsAt: { type: "string" } },
                  required: ["startsAt", "endsAt"],
                },
              },
            },
            required: ["meetingTypeId", "from", "to", "slots"],
          },
          400: {
            type: "object",
            properties: { code: { type: "string" }, message: { type: "string" } },
            required: ["code", "message"],
          },
          404: {
            type: "object",
            properties: { code: { type: "string" }, message: { type: "string" } },
            required: ["code", "message"],
          },
        },
      },
    },
    async (request, reply) => {
      const result = getAvailability(
        meetingTypeRepository.get(request.params.id),
        request.query.from,
        request.query.to,
        now(),
        bookingRepository.list(),
      );
      if ("error" in result) {
        return reply
          .code(result.error.code === "MEETING_TYPE_NOT_FOUND" ? 404 : 400)
          .send(result.error);
      }
      return result;
    },
  );

  app.post<{ Body: unknown }>("/api/bookings", async (request, reply) => {
    const result = bookingRepository.create(request.body);
    if ("error" in result) {
      const status =
        result.error.code === "MEETING_TYPE_NOT_FOUND"
          ? 404
          : result.error.code === "SLOT_UNAVAILABLE"
            ? 409
            : 400;
      return reply.code(status).send(result.error);
    }
    return reply.code(201).send(result);
  });

  app.get(
    "/api/bookings/upcoming",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              bookings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    meetingTypeId: { type: "string" },
                    guestName: { type: "string" },
                    startsAt: { type: "string" },
                    endsAt: { type: "string" },
                    createdAt: { type: "string" },
                  },
                  required: ["id", "meetingTypeId", "guestName", "startsAt", "endsAt", "createdAt"],
                },
              },
            },
            required: ["bookings"],
          },
        },
      },
    },
    async () => ({ bookings: bookingRepository.upcoming() }),
  );

  return app;
}
