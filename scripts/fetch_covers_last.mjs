import { readFileSync, writeFileSync } from "fs";

const RECORDS_PATH = "src/data/records.js";
const raw = readFileSync(RECORDS_PATH, "utf-8");
const match = raw.match(/export const sampleRecords = (\[[\s\S]*?\]);/);
const records = JSON.parse(match[1]);

// Very targeted searches for the last few missing albums
const fallbackSearches = [
  { artist: "Alexisonfire", title: "Death Letter", search: "Alexisonfire" },
  { artist: "Alexisonfire", title: "Otherness", search: "Alexisonfire" },
  {
    artist: "Asking Alexandria",
    title: "Reckless And Relentless",
    search: "Asking Alexandria",
  },
  {
    artist: "Bring Me The Horizon",
    title: "Sempiternal",
    search: "Bring Me The Horizon",
  },
  {
    artist: "Counterparts",
    title: "Live From Toronto",
    search: "Counterparts metalcore",
  },
  {
    artist: "A Day To Remember",
    title: "What Separates Me From You",
    search: "A Day To Remember",
  },
  {
    artist: "Greyhaven",
    title: "This Bright And Beautiful World",
    search: "Greyhaven band",
  },
  { artist: "Metric", title: "Fantasies", search: "Metric Fantasies album" },
  {
    artist: "Polyphia",
    title: "Remember That You Will Die",
    search: "Polyphia",
  },
  { artist: "Sleep Token", title: "Sundowning", search: "Sleep Token" },
  { artist: "Sleep Token", title: "Even In Arcadia", search: "Sleep Token" },
  {
    artist: "Tchaikovsky",
    title: "Swan Lake (Acts 2 and 3)",
    search: "Tchaikovsky Swan Lake ballet",
  },
];

async function search(term, titleHint) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=15`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return "";

    // Try title match
    const hint = titleHint.toLowerCase().substring(0, 10);
    const matched = data.results.find(
      (r) => r.collectionName && r.collectionName.toLowerCase().includes(hint),
    );
    // If no title match, just use first result from same artist
    const result = matched || data.results[0];
    return result.artworkUrl100
      ? result.artworkUrl100.replace("100x100bb", "600x600bb")
      : "";
  } catch {
    return "";
  }
}

const missing = records.filter((r) => !r.coverUrl);
console.log(`Last pass: ${missing.length} records\n`);

let found = 0;
for (const r of missing) {
  const override = fallbackSearches.find(
    (s) => s.artist === r.artist && s.title === r.title,
  );
  const term = override ? override.search : `${r.artist} ${r.title}`;

  process.stdout.write(`${r.artist} - ${r.title}... `);
  const url = await search(term, r.title);
  if (url) {
    r.coverUrl = url;
    found++;
    console.log("found");
  } else {
    console.log("SKIP");
  }
  await new Promise((res) => setTimeout(res, 1200));
}

let output =
  "// Auto-generated from Vinyl Inventory.xlsx\nexport const sampleRecords = ";
output += JSON.stringify(records, null, 2) + ";\n\n";
output += "let nextId = sampleRecords.length + 1;\n\n";
output += "export function generateId() {\n  return nextId++;\n}\n";
writeFileSync(RECORDS_PATH, output);

const total = records.filter((r) => r.coverUrl).length;
console.log(`\nFound: ${found}. Total: ${total}/${records.length}`);
