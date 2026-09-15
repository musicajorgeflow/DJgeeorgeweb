import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { stdin as input, stdout as output } from 'node:process';

const folder = path.dirname(fileURLToPath(import.meta.url));
const database = path.join(folder, 'mashups.json');
const browserData = path.join(folder, 'mashups-data.js');
const assets = path.join(folder, 'assets');
const rl = readline.createInterface({ input, output });
const ask = question => rl.question(question);
const cleanPath = value => value.trim().replace(/^['"]|['"]$/g, '').replace(/\\ /g, ' ');
const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const browserStyle = "document.head.insertAdjacentHTML('beforeend', '<style>.grid{grid-template-columns:repeat(auto-fill,minmax(280px,360px));justify-content:start}.card{width:100%;max-width:360px}h1{line-height:.95}h1 span{color:#ddd4ff;-webkit-text-stroke:0;text-shadow:0 0 28px #a083ff38}@media(max-width:600px){.grid{grid-template-columns:1fr}.card{max-width:none}}</style>');";

async function addMashup() {
  const title = (await ask('Título del mashup: ')).trim();
  if (!title) throw new Error('Necesitas escribir un título.');
  const listen = (await ask('Enlace para escuchar o ver (opcional, cualquier URL): ')).trim();
  const download = (await ask('Enlace externo de descarga (opcional, cualquier URL): ')).trim();
  const coverPath = cleanPath(await ask('Arrastra aquí la PORTADA (JPG/PNG/WebP) y pulsa Enter: '));
  const previewPath = cleanPath(await ask('Arrastra aquí el AUDIO PREVIEW (MP3/M4A/WAV) y pulsa Enter: '));
  await fs.access(coverPath); await fs.access(previewPath); await fs.mkdir(assets, { recursive: true });
  const slug = `${slugify(title) || 'mashup'}-${Date.now()}`;
  const coverName = `${slug}-cover${path.extname(coverPath).toLowerCase()}`;
  const previewName = `${slug}-preview${path.extname(previewPath).toLowerCase()}`;
  await fs.copyFile(coverPath, path.join(assets, coverName));
  await fs.copyFile(previewPath, path.join(assets, previewName));
  const entries = JSON.parse(await fs.readFile(database, 'utf8'));
  entries.unshift({ title, listen, download, cover: `../mashups/assets/${coverName}`, preview: `../mashups/assets/${previewName}` });
  await fs.writeFile(database, `${JSON.stringify(entries, null, 2)}\n`);
  await fs.writeFile(browserData, `window.DJGEEORGE_MASHUPS = ${JSON.stringify(entries, null, 2)};\n${browserStyle}\n`);
  console.log(`\n✓ “${title}” añadido. El preview se ha copiado a mashups/assets.\n`);
}

console.log('\n--- Añadir mashups DJgeeorge ---\n');
try {
  let addAnother = 's';
  while (addAnother === 's' || addAnother === 'si' || addAnother === 'sí') {
    try { await addMashup(); }
    catch (error) { console.error(`\nNo se pudo añadir el mashup: ${error.message}\n`); }
    addAnother = (await ask('¿Quieres añadir otra mezcla? (s/n): ')).trim().toLowerCase();
  }
  console.log('\n✓ Todo guardado. Ya puedes cerrar esta ventana.\n');
} finally { await rl.close(); }
