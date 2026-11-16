import { buildApp } from "./app.js";

const app = buildApp();
const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ host: "127.0.0.1", port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
