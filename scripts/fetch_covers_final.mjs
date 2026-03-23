import { readFileSync, writeFileSync } from "fs";

const RECORDS_PATH = "src/data/records.js";
const raw = readFileSync(RECORDS_PATH, "utf-8");

const match = raw.match(/export const sampleRecords = (\[[\s\S]*?\]);/);
const records = JSON.parse(match[1]);

// Manual search overrides for hard-to-find albums
const manualSearches = {
  "Alexisonfire-Death Letter": "Alexisonfire Death Letter EP",
  "Alexisonfire-Otherness": "Alexisonfire Otherness",
  "Asking Alexandria-Reckless And Relentless":
    "Asking Alexandria Reckless Relentless",
  "Bring Me The Horizon-Sempiternal": "Bring Me Horizon Sempiternal",
  "Counterparts-Live From Toronto": "Counterparts band",
  "A Day To Remember-What Separates Me From You": "Day Remember What Separates",
  "Greyhaven-This Bright And Beautiful World": "Greyhaven Bright Beautiful",
  "Metric-Fantasies": "Metric band Fantasies",
  "Nat King Cole-Stay As Sweet As You Are": "Nat King Cole",
  "Nirvana-Nevermind Box Set": "Nirvana Nevermind",
  "Polyphia-Remember That You Will Die": "Polyphia Remember",
  "Sleep Token-Sundowning": "Sleep Token Sundowning",
  "Sleep Token-Even In Arcadia": "Sleep Token Arcadia",
  "Spiritbox-Singles Collection": "Spiritbox",
  "Star Wars-Lofi Music Vol 1-3": "Star Wars Lofi",
  "Tchaikovsky-Swan Lake (Acts 2 and 3)": "Tchaikovsky Swan Lake",
};

async function fetchCover(searchTerm, title) {
  const query = encodeURIComponent(searchTerm);
  const url = `https://itunes.apple.com/search?term=${query}&entity=album&limit=10`;

  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const searchTitle = title.toLowerCase().substring(0, 12);
      const exactMatch = data.results.find(
        (r) =>
          r.collectionName &&
          r.collectionName.toLowerCase().includes(searchTitle),
      );
      const result = exactMatch || data.results[0];
      return result.artworkUrl100
        ? result.artworkUrl100.replace("100x100bb", "600x600bb")
        : "";
    }
    return "";
  } catch (e) {
    return "";
  }
}

const missing = records.filter((r) => !r.coverUrl);
console.log(`Final pass: ${missing.length} records...\n`);

let found = 0;
for (const r of missing) {
  const key = `${r.artist}-${r.title}`;
  const searchTerm = manualSearches[key] || `${r.artist} ${r.title}`;

  process.stdout.write(`${r.artist} - ${r.title}... `);
  const coverUrl = await fetchCover(searchTerm, r.title);
  if (coverUrl) {
    r.coverUrl = coverUrl;
    found++;
    console.log("found");
  } else {
    console.log("NOT FOUND");
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

let output =
  "// Auto-generated from Vinyl Inventory.xlsx\nexport const sampleRecords = ";
output += JSON.stringify(records, null, 2) + ";\n\n";
output += "let nextId = sampleRecords.length + 1;\n\n";
output += "export function generateId() {\n  return nextId++;\n}\n";
writeFileSync(RECORDS_PATH, output);

const totalFound = records.filter((r) => r.coverUrl).length;
console.log(
  `\nFinal pass found: ${found}. Total covers: ${totalFound}/${records.length}`,
);
