import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const baseUrl = "http://127.0.0.1:5099";
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const contentRoot = fileURLToPath(new URL("../backend/MicroFrontendDemo.Api/", import.meta.url));
const server = spawn(
  "dotnet",
  [
    "backend/MicroFrontendDemo.Api/bin/Release/net10.0/MicroFrontendDemo.Api.dll",
    "--urls",
    baseUrl,
    "--contentRoot",
    contentRoot
  ],
  {
    cwd: projectRoot,
    env: { ...process.env, ASPNETCORE_ENVIRONMENT: "Production" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  }
);

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.on("error", (error) => { serverOutput += `\n${error.message}`; });

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`API process exited with code ${server.exitCode}.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // The process is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`API did not become healthy.\n${serverOutput}`);
}

async function json(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = response.status === 204 ? undefined : await response.json();
  return { response, body };
}

try {
  await waitForServer();

  const products = await json("/api/products/");
  expect(products.response.ok, "Product list request failed.");
  expect(Array.isArray(products.body) && products.body.length >= 6, "Seeded products were not returned.");

  const invalid = await json("/api/products/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sku: "", name: "", category: "", price: -1, inventory: -1, status: "Active" })
  });
  expect(invalid.response.status === 400, "Invalid product should return HTTP 400.");

  const created = await json("/api/products/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sku: "SMOKE-1", name: "Smoke test product", category: "Checks", price: 12.5, inventory: 2, status: "Active" })
  });
  expect(created.response.status === 201 && created.body.id, "Valid product should be created.");

  const removed = await fetch(`${baseUrl}/api/products/${created.body.id}`, { method: "DELETE" });
  expect(removed.status === 204, "Created product should be deleted.");

  const users = await json("/api/users/summary");
  expect(users.response.ok && users.body.pendingInvites >= 1, "User summary did not include seeded invites.");

  const activity = await json("/api/dashboard/activity");
  expect(activity.response.ok && Array.isArray(activity.body), "Dashboard activity request failed.");

  console.log("PASS  live API health, validation, CRUD, summaries, and dashboard activity");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  server.kill();
}
