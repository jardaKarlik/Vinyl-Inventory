import { readFileSync, writeFileSync } from "fs";

const RECORDS_PATH = "src/data/records.js";
const raw = readFileSync(RECORDS_PATH, "utf-8");

const match = raw.match(/export const sampleRecords = (\[[\s\S]*?\]);/);
if (!match) {
  console.error("Could not parse records.js");
  process.exit(1);
}
const records = JSON.parse(match[1]);

async function fetchCover(artist, title) {
  // Try multiple search strategies
  const strategies = [
    // Strategy 1: clean artist + full title
    `${artist.replace(/^The /, "").replace(/,\s*/, " ")} ${title}`,
    // Strategy 2: just artist + short title (first 3 words)
    `${artist.replace(/^The /, "").replace(/,\s*/, " ")} ${title.split(/[\s:(\-]/)[0]}`,
    // Strategy 3: artist only (match any album)
    `${artist.replace(/^The /, "").replace(/,\s*/, " ")}`,
  ];

  for (const searchTerm of strategies) {
    const query = encodeURIComponent(searchTerm);
    const url = `https://itunes.apple.com/search?term=${query}&entity=album&limit=10`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        // Try to find matching album name
        const searchTitle = title.toLowerCase();
        const exactMatch = data.results.find((r) => {
          const name = (r.collectionName || "").toLowerCase();
          return (
            name.includes(searchTitle.substring(0, 15)) ||
            searchTitle.includes(name.substring(0, 15))
          );
        });

        if (exactMatch) {
          return exactMatch.artworkUrl100
            ? exactMatch.artworkUrl100.replace("100x100bb", "600x600bb")
            : "";
        }
      }
    } catch (e) {
      // continue to next strategy
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return "";
}

// Only process records that still have empty coverUrl
const missing = records.filter((r) => !r.coverUrl);
console.log(`Retrying ${missing.length} records with missing covers...\n`);

let found = 0;
let notFound = 0;

for (let i = 0; i < missing.length; i++) {
  const r = missing[i];
  process.stdout.write(
    `[${i + 1}/${missing.length}] ${r.artist} - ${r.title}... `,
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

  // Longer delay for retry
  await new Promise((resolve) => setTimeout(resolve, 800));
}

// Write back
let output =
  "// Auto-generated from Vinyl Inventory.xlsx\nexport const sampleRecords = ";
output += JSON.stringify(records, null, 2) + ";\n\n";
output += "let nextId = sampleRecords.length + 1;\n\n";
output += "export function generateId() {\n  return nextId++;\n}\n";
writeFileSync(RECORDS_PATH, output);

console.log(`\nRetry done! Found: ${found}, Still missing: ${notFound}`);
const totalFound = records.filter((r) => r.coverUrl).length;
console.log(`Total covers: ${totalFound}/${records.length}`);
