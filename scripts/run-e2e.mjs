import { spawn } from "node:child_process";
import { createServer } from "node:net";
import process from "node:process";

const root = new URL("..", import.meta.url).pathname;

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("No test port"));
      server.close(() => resolve(address.port));
    });
  });
}

function waitFor(url, child) {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          clearInterval(timer);
          resolve();
        }
      } catch {
        if (child.exitCode !== null) {
          clearInterval(timer);
          reject(new Error(`Server exited before becoming ready: ${url}`));
        }
      }
    }, 100);
    setTimeout(() => {
      clearInterval(timer);
      reject(new Error(`Timed out waiting for ${url}`));
    }, 30_000).unref();
  });
}

const apiPort = await freePort();
const webPort = await freePort();
const children = [];
const command = process.platform === "win32" ? "npm.cmd" : "npm";

function start(args, env) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
    detached: process.platform !== "win32",
  });
  children.push(child);
  return child;
}

const api = start(["run", "dev", "--workspace", "@call-calendar/api"], { PORT: String(apiPort) });
const web = start(
  [
    "run",
    "dev",
    "--workspace",
    "@call-calendar/web",
    "--",
    "--host",
    "127.0.0.1",
    "--port",
    String(webPort),
  ],
  {
    API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
  },
);

async function stop() {
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (process.platform === "win32") child.kill("SIGTERM");
    else process.kill(-child.pid, "SIGTERM");
  }
  await Promise.all(
    children.map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null) return resolve();
          const timer = setTimeout(() => {
            if (process.platform === "win32") child.kill("SIGKILL");
            else process.kill(-child.pid, "SIGKILL");
            resolve();
          }, 5_000);
          child.once("exit", () => {
            clearTimeout(timer);
            resolve();
          });
        }),
    ),
  );
}

try {
  await waitFor(`http://127.0.0.1:${apiPort}/api/health`, api);
  await waitFor(`http://127.0.0.1:${webPort}`, web);
  const result = spawn(command, ["exec", "playwright", "test"], {
    cwd: root,
    env: { ...process.env, PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${webPort}` },
    stdio: "inherit",
  });
  result.once("exit", async (code, signal) => {
    await stop();
    process.exitCode = code ?? (signal ? 1 : 0);
  });
} catch (error) {
  await stop();
  console.error(error);
  process.exitCode = 1;
}
