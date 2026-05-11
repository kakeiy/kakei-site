import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const port = Number(process.env.PORT || 4173);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

const resolveFile = async (urlPath) => {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const requested = normalize(join(distDir, cleanPath || "index.html"));
  if (!requested.startsWith(distDir)) return { file: join(distDir, "404.html"), status: 404 };

  try {
    const info = await stat(requested);
    if (info.isDirectory()) return { file: join(requested, "index.html"), status: 200 };
    return { file: requested, status: 200 };
  } catch {
    return { file: join(distDir, "404.html"), status: 404 };
  }
};

const server = createServer(async (request, response) => {
  const { file, status } = await resolveFile(request.url || "/");
  response.statusCode = status;
  response.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
  createReadStream(file)
    .on("error", () => {
      response.statusCode = 500;
      response.end("Server error");
    })
    .pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`kakei.dev local preview: http://127.0.0.1:${port}`);
});
