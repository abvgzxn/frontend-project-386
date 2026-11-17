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

  return app;
}
