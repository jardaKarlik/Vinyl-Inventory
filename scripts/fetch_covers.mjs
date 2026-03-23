import { readFileSync, writeFileSync } from "fs";

const RECORDS_PATH = "src/data/records.js";
const raw = readFileSync(RECORDS_PATH, "utf-8");

// Extract the array from the JS file
const match = raw.match(/export const sampleRecords = (\[[\s\S]*?\]);/);
if (!match) {
  console.error("Could not parse records.js");
  process.exit(1);
}
const records = JSON.parse(match[1]);

async function fetchCover(artist, title) {
  // Clean up artist name for search
  let searchArtist = artist.replace(/^The /, "").replace(/,\s*/, " ");

  const query = encodeURIComponent(`${searchArtist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&entity=album&limit=5`;

  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      // Try to find exact match first
      const searchTitle = title.toLowerCase().substring(0, 20);
      const exactMatch = data.results.find(
        (r) =>
          r.collectionName &&
          r.collectionName.toLowerCase().includes(searchTitle),
      );
      const result = exactMatch || data.results[0];
      // Upgrade to 600x600 artwork
      return result.artworkUrl100
        ? result.artworkUrl100.replace("100x100bb", "600x600bb")
        : "";
    }
    return "";
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    return "";
  }
}

let found = 0;
let notFound = 0;

for (let i = 0; i < records.length; i++) {
  const r = records[i];
  process.stdout.write(
    `[${i + 1}/${records.length}] ${r.artist} - ${r.title}... `,
  );

  const coverUrl = await fetchCover(r.artist, r.title);
  if (coverUrl) {
    r.coverUrl = coverUrl;
    found++;
    console.log("found");
  } else {
    notFound++;
    console.log("NOT FOUND");
  }

  // Small delay to respect rate limits
  await new Promise((resolve) => setTimeout(resolve, 350));
}

// Write back to records.js
let output =
  "// Auto-generated from Vinyl Inventory.xlsx\nexport const sampleRecords = ";
output += JSON.stringify(records, null, 2) + ";\n\n";
output += "let nextId = sampleRecords.length + 1;\n\n";
output += "export function generateId() {\n  return nextId++;\n}\n";
writeFileSync(RECORDS_PATH, output);

console.log(`\nDone! Found: ${found}, Not found: ${notFound}`);
