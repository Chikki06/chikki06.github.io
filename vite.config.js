import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.resolve(__dirname, "content");
const TIMELINE_PATH = path.join(CONTENT_DIR, "timeline.json");
const SITE_PATH = path.join(CONTENT_DIR, "site.json");
const PUBLIC_TIMELINE_DIR = path.resolve(__dirname, "public", "timeline");

// During development, /admin uses this dev-only API to read/write the JSON
// content store under `content/`. In production (GitHub Pages), there is no
// /api – the site is fully static and reads from the bundled JSON.

export default defineConfig({
  plugins: [
    react(),
    {
      name: "dev-content-api",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();

          // JSON content read/write
          if (req.url.startsWith("/api/dev-content")) {
            if (req.method === "GET") {
              try {
                const timelineRaw = fs.readFileSync(TIMELINE_PATH, "utf8");
                const siteRaw = fs.readFileSync(SITE_PATH, "utf8");
                const timeline = JSON.parse(timelineRaw);
                const site = JSON.parse(siteRaw);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true, timeline, site }));
              } catch (err) {
                console.error("[dev-content-api] Failed to read content:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: "Failed to read content.",
                  }),
                );
              }
              return;
            }

            if (req.method === "PUT") {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk;
              });
              req.on("end", () => {
                try {
                  const parsed = JSON.parse(body || "{}");
                  const { timeline, site } = parsed;

                  if (!Array.isArray(timeline)) {
                    throw new Error("`timeline` must be an array.");
                  }
                  if (typeof site !== "object" || site === null) {
                    throw new Error("`site` must be an object.");
                  }

                  fs.writeFileSync(
                    TIMELINE_PATH,
                    JSON.stringify(timeline, null, 2) + "\n",
                    "utf8",
                  );
                  fs.writeFileSync(
                    SITE_PATH,
                    JSON.stringify(site, null, 2) + "\n",
                    "utf8",
                  );

                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ ok: true, timeline, site }));
                } catch (err) {
                  console.error(
                    "[dev-content-api] Failed to save content:",
                    err,
                  );
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(
                    JSON.stringify({
                      ok: false,
                      error: err?.message || "Failed to save content.",
                    }),
                  );
                }
              });
              return;
            }
          }

          // Image upload via base64 data URL
          if (req.url.startsWith("/api/dev-upload-image") && req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                const parsed = JSON.parse(body || "{}");
                const { nodeId, dataUrl, originalName } = parsed;

                if (!nodeId || typeof nodeId !== "string") {
                  throw new Error("`nodeId` is required.");
                }
                if (!dataUrl || typeof dataUrl !== "string") {
                  throw new Error("`dataUrl` is required.");
                }

                const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
                if (!match) {
                  throw new Error("Invalid data URL.");
                }

                const mime = match[1];
                const base64 = match[2];
                const buffer = Buffer.from(base64, "base64");

                let ext = "";
                if (mime === "image/png") ext = ".png";
                else if (mime === "image/jpeg" || mime === "image/jpg")
                  ext = ".jpg";
                else if (mime === "image/webp") ext = ".webp";
                else if (mime === "image/gif") ext = ".gif";
                else ext = "";

                const safeName =
                  (originalName || "upload")
                    .toLowerCase()
                    .replace(/[^a-z0-9_.-]+/g, "-") || "upload";

                const ts = Date.now();
                const fileName = `${ts}-${safeName}${ext}`;
                const nodeDir = path.join(PUBLIC_TIMELINE_DIR, nodeId);

                fs.mkdirSync(nodeDir, { recursive: true });
                const filePath = path.join(nodeDir, fileName);
                fs.writeFileSync(filePath, buffer);

                const publicSrc = `/timeline/${nodeId}/${fileName}`;

                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    ok: true,
                    src: publicSrc,
                  }),
                );
              } catch (err) {
                console.error(
                  "[dev-content-api] Failed to handle image upload:",
                  err,
                );
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: err?.message || "Failed to upload image.",
                  }),
                );
              }
            });
            return;
          }

          return next();
        });
      },
    },
  ],
  base: "/",
});


