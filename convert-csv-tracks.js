#!/usr/bin/env node
/**
 * convert-csv-tracks.js
 *
 * Reads all .csv files in the project root (Traktor/DJ exports) and converts
 * them into the digitalTracks.json format the React app expects.
 *
 * Usage:
 *   node convert-csv-tracks.js
 *
 * Reads:  *.csv  (in project root)
 * Writes: public/digitalTracks.json
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "digitalTracks.json");

// ── helpers ────────────────────────────────────────────────────────────────

/** Generate a stable-ish 12-char hex id from a seed string */
function makeId(seed) {
  return crypto.createHash("md5").update(seed).digest("hex").slice(0, 12);
}

/** Parse a single CSV line respecting quoted fields */
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/** Read and parse a CSV file, returning an array of row objects */
function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.replace(/^"|"$/g, "").trim()
  );
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (values[idx] || "").replace(/^"|"$/g, "").trim();
    });
    rows.push(obj);
  }
  return rows;
}

/** Normalise a field: strip quotes, collapse whitespace, trim */
function clean(val) {
  return (val || "").replace(/\s+/g, " ").trim();
}

// ── main ───────────────────────────────────────────────────────────────────

// 1. Collect all CSV files in the project root
const csvFiles = fs
  .readdirSync(ROOT)
  .filter((f) => f.toLowerCase().endsWith(".csv"))
  .sort();

if (csvFiles.length === 0) {
  console.log("No .csv files found in project root. Nothing to do.");
  process.exit(0);
}

console.log(`Found CSV files:\n  ${csvFiles.join("\n  ")}\n`);

// 2. Parse every CSV and flatten into one big array
const allRows = [];
for (const file of csvFiles) {
  const rows = parseCsv(path.join(ROOT, file));
  console.log(`  ${file}: ${rows.length} rows`);
  allRows.push(...rows);
}
console.log(`\nTotal rows: ${allRows.length}\n`);

// 3. Map CSV rows → app JSON shape & deduplicate
const seen = new Set();
const tracks = [];

for (const row of allRows) {
  const title = clean(row.title || row.Title);
  const artist = clean(row.artist || row.Artist);
  const album = clean(row.albumTitle || row.album || row.Album);

  // Skip completely empty rows
  if (!title && !artist) continue;

  // Dedup key: artist+title+album (lowercased)
  const dedupKey = `${artist.toLowerCase()}|${title.toLowerCase()}|${album.toLowerCase()}`;
  if (seen.has(dedupKey)) continue;
  seen.add(dedupKey);

  const bpm = clean(row.bpm || row.BPM);
  const key = clean(row.key || row.Key);
  const bitrate = clean(row.bitrate || row.Bitrate);
  const genre = clean(row.genre || row.Genre);
  const rating = clean(row.rating || row.Rating || "0");
  const label = clean(row.label || row.Label);
  const yearRaw = clean(row.year || row.Year);
  const duration = clean(row.duration || row.Duration);

  // Normalise year to a number or null
  let year = null;
  if (yearRaw && /^\d{2,4}$/.test(yearRaw)) {
    const n = parseInt(yearRaw, 10);
    year = n > 99 ? n : null; // "2" is meaningless as a year
  }

  // Normalise format from bitrate
  let format = "";
  if (bitrate) {
    format = /^\d+$/.test(bitrate) ? `${bitrate}kbps` : bitrate;
  }

  const id = makeId(`${artist}|${title}|${album}`);

  tracks.push({
    id,
    artist,
    title,
    album,
    year,
    genre,
    bpm,
    key,
    format,
    duration,
    label,
    rating,
    filename: "",
    folder: "",
    coverUrl: "",
  });
}

// 4. Sort alphabetically by artist, then title
tracks.sort((a, b) => {
  const aa = a.artist.toLowerCase();
  const bb = b.artist.toLowerCase();
  if (aa < bb) return -1;
  if (aa > bb) return 1;
  return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
});

// 5. Write output
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(tracks, null, 2), "utf-8");

console.log(`=== Done ===`);
console.log(`  Unique tracks: ${tracks.length}`);
console.log(`  Output:        ${OUT}`);
