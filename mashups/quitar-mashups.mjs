import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { stdin as input, stdout as output } from 'node:process';

const folder = path.dirname(fileURLToPath(import.meta.url));
const database = path.join(folder, 'mashups.json');
const browserData = path.join(folder, 'mashups-data.js');
const assets = path.resolve(folder, 'assets');
const rl = readline.createInterface({ input, output });
const ask = question => rl.question(question);
const browserStyle = "document.head.insertAdjacentHTML('beforeend', '<style>.grid{grid-template-columns:repeat(auto-fill,minmax(280px,360px));justify-content:start}.card{width:100%;max-width:360px}h1{line-height:.95}h1 span{color:#ddd4ff;-webkit-text-stroke:0;text-shadow:0 0 28px #a083ff38}@media(max-width:600px){.grid{grid-template-columns:1fr}.card{max-width:none}}</style>');";

function assetFiles(entry) {
  return [entry.cover, entry.preview].filter(Boolean).map(file => path.resolve(folder, file)).filter(file => {
    const relative = path.relative(assets, file);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  });
}

try {
  const entries = JSON.parse(await fs.readFile(database, 'utf8'));
  if (!entries.length) console.log('\nNo hay mashups para quitar.\n');
  else {
    console.log('\n--- Quitar mashups DJgeeorge ---\n');
    entries.forEach((entry, index) => console.log(`${index + 1}. ${entry.title}`));
    const answer = (await ask('\nEscribe los números a borrar separados por comas (ejemplo: 1, 3, 5): ')).trim();
    if (!answer) console.log('\nNo se ha borrado nada.\n');
    else {
      const numbers = [...new Set(answer.split(',').map(value => Number(value.trim())))];
      if (!numbers.length || numbers.some(number => !Number.isInteger(number) || number < 1 || number > entries.length)) throw new Error('Usa solo números válidos de la lista, separados por comas.');
      const indexes = new Set(numbers.map(number => number - 1));
      const selected = entries.filter((_, index) => indexes.has(index));
      console.log(`\nVas a borrar: ${selected.map(entry => `“${entry.title}”`).join(', ')}`);
      const confirm = (await ask('¿Confirmas el borrado? (s/n): ')).trim().toLowerCase();
      if (confirm === 's' || confirm === 'si' || confirm === 'sí') {
        const remaining = entries.filter((_, index) => !indexes.has(index));
        await fs.writeFile(database, `${JSON.stringify(remaining, null, 2)}\n`);
        await fs.writeFile(browserData, `window.DJGEEORGE_MASHUPS = ${JSON.stringify(remaining, null, 2)};\n${browserStyle}\n`);
        await Promise.all(selected.flatMap(assetFiles).map(file => fs.unlink(file).catch(error => error.code === 'ENOENT' ? undefined : Promise.reject(error))));
        console.log(`\n✓ ${selected.length} mashup${selected.length === 1 ? '' : 's'} borrado${selected.length === 1 ? '' : 's'}, junto con sus previews y portadas locales.\n`);
      } else console.log('\nNo se ha borrado nada.\n');
    }
  }
} catch (error) { console.error(`\nNo se pudo quitar el mashup: ${error.message}\n`); }
finally { await rl.close(); }
