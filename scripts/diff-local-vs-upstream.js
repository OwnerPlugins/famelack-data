const fs = require('fs');
const { execSync } = require('child_process');

const upstreamUrl = 'https://raw.githubusercontent.com/famelack/famelack-data/main/tv/raw/countries/it.json';

const upstream = JSON.parse(execSync(`curl -fsSL ${upstreamUrl}`).toString());
const mine     = JSON.parse(fs.readFileSync('tv/raw/countries/it.local.json', 'utf8'));

// Estrae l'URL "identificativo" di un canale (primo stream)
const streamOf = c => (c.sources?.streams?.[0]) || '';

const upstreamById = new Map(upstream.map(c => [c.nanoid, c]));

const added    = [];   // solo nel tuo file
const modified = [];   // in entrambi ma URL diverso

for (const c of mine) {
  const u = upstreamById.get(c.nanoid);
  if (!u) {
    added.push(c);
  } else if (streamOf(u) !== streamOf(c)) {
    modified.push(c);
  }
  // else: identico all'upstream → scartato
}

const custom = [...modified, ...added];
custom.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

// Output 1: file pulito con i soli override
fs.writeFileSync(
  'tv/raw/countries/it.custom.json',
  JSON.stringify(custom, null, 2) + '\n'
);

// Output 2: report leggibile per farti vedere cosa ha trovato
const lines = [];
lines.push(`=== AGGIUNTI (${added.length}) ===`);
added.forEach(c => lines.push(`  + ${c.name}  [${streamOf(c)}]`));
lines.push('');
lines.push(`=== MODIFICATI (${modified.length}) ===`);
modified.forEach(c => {
  const u = upstreamById.get(c.nanoid);
  lines.push(`  ~ ${c.name}`);
  lines.push(`      upstream: ${streamOf(u)}`);
  lines.push(`      tuo:      ${streamOf(c)}`);
});
fs.writeFileSync('it.custom.report.txt', lines.join('\n'));

console.log(`Upstream:   ${upstream.length} canali`);
console.log(`Tuo file:   ${mine.length} canali`);
console.log(`Aggiunti:   ${added.length}`);
console.log(`Modificati: ${modified.length}`);
console.log(`→ it.custom.json (${custom.length} canali)`);
console.log(`→ it.custom.report.txt (report leggibile)`);
