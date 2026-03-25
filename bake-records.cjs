// bake-records.js
// Run from your project root: node bake-records.js

const fs = require('fs');
const path = require('path');

const recordsJson = path.join(__dirname, 'data', 'records.json');
const outFile = path.join(__dirname, 'src', 'data', 'records.js');

const records = JSON.parse(fs.readFileSync(recordsJson, 'utf-8'));

const output = `export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const sampleRecords = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync(outFile, output, 'utf-8');
console.log('Done! Baked ' + records.length + ' records into src/data/records.js');
