import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./dist/server/server.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIR = join(__dirname, "dist", "client");
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

async function tryServeStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const url = new URL(req.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);
  const safe = normalize(pathname).replace(/^([/\\])+/, "/");
  if (safe.includes("..")) return false;
  const filePath = join(CLIENT_DIR, safe);
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return false;
    const ext = extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const data = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    });
    res.end(req.method === "HEAD" ? undefined : data);
    return true;
  } catch {
    return false;
  }
}

function nodeReqToWebRequest(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || `${HOST}:${PORT}`;
  const url = new URL(req.url, `${proto}://${host}`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) for (const vv of v) headers.append(k, vv);
    else if (v != null) headers.set(k, v);
  }
  const method = req.method || "GET";
  const init = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = req;
    init.duplex = "half";
  }
  return new Request(url.toString(), init);
}

async function writeWebResponse(webRes, res) {
  const headers = {};
  webRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      const existing = headers["set-cookie"];
      if (existing) headers["set-cookie"] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      else headers["set-cookie"] = value;
    } else {
      headers[key] = value;
    }
  });
  res.writeHead(webRes.status, headers);
  if (!webRes.body) {
    res.end();
    return;
  }
  const reader = webRes.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

const server = createServer(async (req, res) => {
  try {
    if (await tryServeStatic(req, res)) return;
    const webReq = nodeReqToWebRequest(req);
    const webRes = await handler.fetch(webReq);
    await writeWebResponse(webRes, res);
  } catch (err) {
    console.error("Request error:", err);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
