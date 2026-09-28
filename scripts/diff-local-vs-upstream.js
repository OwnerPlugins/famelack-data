const fs = require('fs');
const { execSync } = require('child_process');

const upstreamUrl = 'https://raw.githubusercontent.com/famelack/famelack-data/main/tv/raw/countries/it.json';

const upstream = JSON.parse(execSync(`curl -fsSL ${upstreamUrl}`).toString());
const mine     = JSON.parse(fs.readFileSync('tv/raw/countries/it.local.json', 'utf8'));

const upstreamById = new Map(upstream.map(c => [c.nanoid, c]));

const added    = [];
const modified = [];

for (const c of mine) {
  const u = upstreamById.get(c.nanoid);
  if (!u) {
    added.push({ mine: c, up: null });
  } else if (JSON.stringify(u) !== JSON.stringify(c)) {
    modified.push({ mine: c, up: u });
  }
}

// Report dettagliato campo per campo
const lines = [];
lines.push(`Upstream:   ${upstream.length}`);
lines.push(`Tuo file:   ${mine.length}`);
lines.push(`Aggiunti:   ${added.length}`);
lines.push(`Modificati: ${modified.length} (confronto integrale)`);
lines.push('');

if (added.length) {
  lines.push(`=== AGGIUNTI ===`);
  added.forEach(({ mine }) => lines.push(`  + ${mine.name} [${mine.nanoid}]`));
  lines.push('');
}

if (modified.length) {
  lines.push(`=== MODIFICATI (dettaglio) ===`);
  modified.forEach(({ mine, up }) => {
    lines.push(`  ~ ${mine.name} [${mine.nanoid}]`);
    const keys = new Set([...Object.keys(up), ...Object.keys(mine)]);
    for (const k of keys) {
      const a = JSON.stringify(up[k]);
      const b = JSON.stringify(mine[k]);
      if (a !== b) {
        lines.push(`      ${k}:`);
        lines.push(`         upstream: ${a}`);
        lines.push(`         tuo:      ${b}`);
      }
    }
  });
}

fs.writeFileSync('it.custom.report.txt', lines.join('\n') + '\n');
console.log(lines.join('\n'));

// Salva it.local.json ridotto solo se ci sono davvero differenze
const custom = [...modified.map(x => x.mine), ...added.map(x => x.mine)];
custom.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

if (custom.length === 0) {
  console.log('\n>>> Nessuna differenza: it.local.json NON modificato.');
  console.log('>>> Se sei sicuro di non avere override, puoi svuotarlo manualmente con [].');
} else {
  fs.writeFileSync(
    'tv/raw/countries/it.local.json',
    JSON.stringify(custom, null, 2) + '\n'
  );
  console.log(`\n>>> it.local.json ridotto a ${custom.length} canali.`);
}
