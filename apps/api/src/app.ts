import Fastify from "fastify";
import { createMeetingTypeRepository, type MeetingType } from "./meeting-types.js";

export type { MeetingType } from "./meeting-types.js";

type AppOptions = {
  meetingTypes?: MeetingType[];
};

export function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false });
  const meetingTypeRepository = createMeetingTypeRepository(options.meetingTypes);

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

  return app;
}
