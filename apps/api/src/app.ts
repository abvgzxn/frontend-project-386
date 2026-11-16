import Fastify from "fastify";

export function buildApp() {
  const app = Fastify({ logger: false });

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

  return app;
}
