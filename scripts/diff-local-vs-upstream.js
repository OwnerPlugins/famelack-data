const fs = require('fs');
const { execSync } = require('child_process');

const upstreamUrl = 'https://raw.githubusercontent.com/famelack/famelack-data/main/tv/raw/countries/it.json';

const upstream = JSON.parse(execSync(`curl -fsSL ${upstreamUrl}`).toString());
const mine     = JSON.parse(fs.readFileSync('tv/raw/countries/it.local.json', 'utf8'));

const streamOf = c => (c.sources?.streams?.[0]) || '';
const upstreamById = new Map(upstream.map(c => [c.nanoid, c]));

const added    = [];
const modified = [];

for (const c of mine) {
  const u = upstreamById.get(c.nanoid);
  if (!u) {
    added.push(c);
  } else if (streamOf(u) !== streamOf(c)) {
    modified.push(c);
  }
}

const custom = [...modified, ...added];
custom.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

fs.writeFileSync(
  'tv/raw/countries/it.local.json',
  JSON.stringify(custom, null, 2) + '\n'
);

const lines = [];
lines.push(`Upstream:   ${upstream.length} canali`);
lines.push(`Tuo file:   ${mine.length} canali`);
lines.push(`Aggiunti:   ${added.length}`);
lines.push(`Modificati: ${modified.length}`);
lines.push(`Nuovo it.local.json: ${custom.length} canali`);
lines.push('');
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

fs.writeFileSync('it.custom.report.txt', lines.join('\n') + '\n');
console.log(lines.join('\n'));
