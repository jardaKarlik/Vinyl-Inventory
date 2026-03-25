import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import querystring from "node:querystring";
import fs from "node:fs";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

// ---------------------------------------------------------------------------
// Records API
// ---------------------------------------------------------------------------
function recordsApiPlugin() {
  const DATA_DIR = path.resolve(process.cwd(), "data");
  const DATA_FILE = path.join(DATA_DIR, "records.json");
  function readRecords() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      }
    } catch (e) {
      console.error("[records-api] Failed to read", DATA_FILE, e);
    }
    return null;
  }
  function writeRecords(records) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
  }
  return {
    name: "records-api",
    configureServer(server) {
      server.middlewares.use("/api/records", (req, res, next) => {
        if (req.method !== "GET") return next();
        const records = readRecords();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ records }));
      });
      server.middlewares.use("/api/records", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
          try {
            const { records } = JSON.parse(body);
            writeRecords(records);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Genre options API
// ---------------------------------------------------------------------------
function genreOptionsApiPlugin() {
  const DATA_DIR = path.resolve(process.cwd(), "data");
  const DATA_FILE = path.join(DATA_DIR, "genreOptions.json");
  function readOptions() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      }
    } catch (e) {
      console.error("[genre-options-api] Failed to read", DATA_FILE, e);
    }
    return null;
  }
  function writeOptions(data) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }
  return {
    name: "genre-options-api",
    configureServer(server) {
      server.middlewares.use("/api/genre-options", (req, res, next) => {
        if (req.method !== "GET") return next();
        const data = readOptions();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      });
      server.middlewares.use("/api/genre-options", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            writeOptions(data);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Digital tracks API — GET /api/digital-tracks
// Reads data/digitalTracks.json and returns the array
// ---------------------------------------------------------------------------
function digitalTracksApiPlugin() {
  const DATA_DIR = path.resolve(process.cwd(), "data");
  const DATA_FILE = path.join(DATA_DIR, "digitalTracks.json");
  function readTracks() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      }
    } catch (e) {
      console.error("[digital-tracks-api] Failed to read", DATA_FILE, e);
    }
    return [];
  }
  return {
    name: "digital-tracks-api",
    configureServer(server) {
      server.middlewares.use("/api/digital-tracks", (req, res, next) => {
        if (req.method !== "GET") return next();
        const tracks = readTracks();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ tracks }));
      });
    },
  };
}

// ---------------------------------------------------------------------------
// iTunes artwork proxy (api.php)
// ---------------------------------------------------------------------------
function itunesApiPlugin() {
  return {
    name: "itunes-api",
    configureServer(server) {
      server.middlewares.use("/api.php", (req, res, next) => {
        if (req.method !== "GET") return next();
        const url = new URL(req.url, "http://localhost");
        const params = Object.fromEntries(url.searchParams);
        if (params.type !== "request") return next();
        const search = params.query;
        if (!search) {
          res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ error: "missing query" }));
          return;
        }
        const entity = params.entity;
        const country = params.country;
        let itunesUrl;
        if (params.entity === "id" || params.entity === "idAlbum") {
          itunesUrl = "https://itunes.apple.com/lookup?id=" + encodeURIComponent(search).replace(/%20/g, "+") + "&country=" + params.country;
        } else {
          itunesUrl = "https://itunes.apple.com/search?term=" + encodeURIComponent(search).replace(/%20/g, "+") + "&country=" + country + "&entity=" + entity;
        }
        itunesUrl += "&limit=25";
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ url: itunesUrl }));
      });
      server.middlewares.use("/api.php", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
          const post = querystring.parse(body);
          if (post.type !== "data") { next(); return; }
          let json;
          try { json = JSON.parse(post.json); } catch {
            res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
            res.end(JSON.stringify({ error: "bad json" }));
            return;
          }
          const entity = post.entity || "tvSeason";
          const output = [];
          for (const result of json.results || []) {
            if (post.entity === "id" && result.kind !== "feature-movie" && result.wrapperType !== "collection") continue;
            if (post.entity === "idAlbum" && result.collectionType !== "Album") continue;
            const data = {};
            data.url = (result.artworkUrl100 || "").replace("100x100", "600x600");
            let hires = (result.artworkUrl100 || "").replace("100x100bb", "100000x100000-999");
            try {
              const parsed = new URL(hires);
              hires = "https://is5-ssl.mzstatic.com" + parsed.pathname;
            } catch { /* keep as-is */ }
            data.hires = hires;
            data.title = entity === "movie" ? result.trackName : result.collectionName;
            if (post.entity === "album") {
              const parts = hires.split("/image/thumb/");
              if (parts.length === 2) {
                const segs = parts[1].split("/");
                segs.pop();
                data.uncompressed = "https://a5.mzstatic.com/us/r1000/0/" + segs.join("/");
              }
            }
            switch (entity) {
              case "album":
                data.title = result.collectionName + " (by " + result.artistName + ")";
                break;
            }
            if (data.title) {
              data.artworkUrl100 = result.artworkUrl100;
              data.collectionName = result.collectionName;
              data.artistName = result.artistName;
              output.push(data);
            }
          }
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify(output));
        });
      });
    },
  };
}

export default defineConfig({
  base: '/Vinyl-Inventory/',
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      includeAssets: ["vinyl-icon.svg", "vinyl-icon-192.png", "vinyl-icon-512.png"],
      manifest: {
        name: "Vinyl Collection",
        short_name: "Vinyl",
        description: "Browse and manage your vinyl record collection",
        start_url: "/",
        display: "standalone",
        background_color: "#242424",
        theme_color: "#242424",
        orientation: "any",
        icons: [
          { src: "/vinyl-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/vinyl-icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/vinyl-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
    recordsApiPlugin(),
    genreOptionsApiPlugin(),
    digitalTracksApiPlugin(),
    itunesApiPlugin(),
  ],
  server: {
    host: true,
    port: 3000,
  },
});
