const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COUNTRY = process.argv[2] || 'it';
const baseDir = path.resolve('tv/raw/countries');

const localPath  = path.join(baseDir, `${COUNTRY}.local.json`);
const outputPath = path.join(baseDir, `${COUNTRY}.json`);

// Legge l'upstream direttamente da GitHub (raw), così non serve un checkout separato
const upstreamUrl = `https://raw.githubusercontent.com/famelack/famelack-data/main/tv/raw/countries/${COUNTRY}.json`;
const upstreamRaw = execSync(`curl -fsSL ${upstreamUrl}`).toString();

const upstream = JSON.parse(upstreamRaw);
const local = fs.existsSync(localPath)
  ? JSON.parse(fs.readFileSync(localPath, 'utf8'))
  : [];

const localById = new Map(local.map(c => [c.nanoid, c]));
const upstreamIds = new Set(upstream.map(c => c.nanoid));

// 1) Parti dall'upstream; se un canale è anche in local → vince local
const merged = upstream.map(c => localById.has(c.nanoid) ? localById.get(c.nanoid) : c);

// 2) Aggiungi i canali presenti SOLO in local
for (const c of local) {
  if (!upstreamIds.has(c.nanoid)) merged.push(c);
}

// 3) Ordina per nome per avere diff puliti
merged.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2) + '\n');

console.log(`[merge] upstream=${upstream.length} local=${local.length} merged=${merged.length}`);
