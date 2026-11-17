import { buildApp } from "./app.js";
import { fileURLToPath } from "node:url";

const configuredNow = process.env.CALL_CALENDAR_NOW;
const app = buildApp({
  ...(configuredNow ? { now: () => new Date(configuredNow) } : {}),
  ...(process.env.NODE_ENV === "production"
    ? { staticRoot: fileURLToPath(new URL("../../web/dist", import.meta.url)) }
    : {}),
});
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

async function shutdown() {
  await app.close();
  process.exit(0);
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
