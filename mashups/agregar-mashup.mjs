import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stdin as input, stdout as output } from 'node:process';

const folder = path.dirname(fileURLToPath(import.meta.url));
const database = path.join(folder, 'mashups.json');
const browserData = path.join(folder, 'mashups-data.js');
const assets = path.join(folder, 'assets');
const youtubeKeyFile = path.join(folder, '.youtube-api-key');
const youtubeHandle = 'DJgeeorge';
const rl = readline.createInterface({ input, output });
const ask = question => rl.question(question);
const cleanPath = value => value.trim().replace(/^['"]|['"]$/g, '').replace(/\\ /g, ' ');
const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const browserStyle = "document.head.insertAdjacentHTML('beforeend', '<style>.grid{grid-template-columns:repeat(auto-fill,minmax(280px,360px));justify-content:start}.card{width:100%;max-width:360px}h1{line-height:.95}h1 span{color:#ddd4ff;-webkit-text-stroke:0;text-shadow:0 0 28px #a083ff38}@media(max-width:600px){.grid{grid-template-columns:1fr}.card{max-width:none}}</style>');";
const readClipboard = () => new Promise((resolve, reject) => execFile('pbpaste', (error, stdout) => error ? reject(error) : resolve(stdout)));

function validUrl(value, label) {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} debe ser una URL válida (https://...).`);
  }
}

function validYouTubeUrl(value) {
  const url = validUrl(value, 'El enlace de YouTube');
  if (!url) return '';
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  if (!['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
    throw new Error('El enlace debe ser de YouTube (youtube.com o youtu.be).');
  }
  return url;
}

function youtubeChoice(value) {
  const answer = value.trim().toLowerCase();
  if (['h', 'no hay', 'nohay', 'no tengo'].includes(answer)) return { listen: '', pending: true };
  return { listen: validYouTubeUrl(value), pending: false };
}

function downloadColors(value) {
  if (!value.trim()) return [];
  const colors = value.split(',').map(color => color.trim()).filter(Boolean);
  if (colors.length < 2 || colors.length > 3) throw new Error('Escribe dos o tres colores separados por comas.');
  return colors.map(color => {
    const hex = color.replace(/^#/, '');
    if (!/^[0-9a-f]{3,4}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/i.test(hex)) {
      throw new Error(`“${color}” no es un color hexadecimal válido.`);
    }
    return `#${hex}`;
  });
}

async function youtubeKey() {
  try {
    const key = (await fs.readFile(youtubeKeyFile, 'utf8')).trim();
    if (key) return key;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  console.log('\nPara buscar en tu canal de YouTube necesito la API key una sola vez.');
  console.log('Se guardará solo en mashups/.youtube-api-key y Git la ignorará.');
  const key = (await ask('Pega la API key de YouTube (Enter para pegar el enlace a mano): ')).trim();
  if (!key) return '';
  await fs.writeFile(youtubeKeyFile, `${key}\n`, { mode: 0o600 });
  await fs.chmod(youtubeKeyFile, 0o600);
  return key;
}

async function youtubeRequest(endpoint, params, key) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries({ ...params, key }).forEach(([name, value]) => url.searchParams.set(name, value));
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('No se pudo conectar con YouTube. Comprueba tu conexión e inténtalo de nuevo.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `YouTube respondió con ${response.status}.`);
  return data;
}

async function findYouTubeVideos(query, key) {
  const channel = await youtubeRequest('channels', { part: 'id', forHandle: youtubeHandle }, key);
  const channelId = channel.items?.[0]?.id;
  if (!channelId) throw new Error(`No se encontró el canal @${youtubeHandle} con esa API key.`);
  const result = await youtubeRequest('search', { part: 'snippet', channelId, q: query, type: 'video', maxResults: '5' }, key);
  return (result.items || []).map(item => ({
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`
  }));
}

async function chooseYouTubeVideo(title) {
  const key = await youtubeKey();
  if (!key) return youtubeChoice(await ask('Enlace de YouTube / escribe “no hay” / Enter para omitir: '));
  let query = title;
  while (true) {
    console.log(`\nBuscando vídeos parecidos a “${query}” en @${youtubeHandle}…`);
    let videos;
    try {
      videos = await findYouTubeVideos(query, key);
    } catch (error) {
      console.log(`⚠ No se pudo buscar en YouTube: ${error.message}`);
      return youtubeChoice(await ask('Pega el enlace de YouTube / escribe “no hay” / Enter para omitir: '));
    }
    if (!videos.length) {
      const action = (await ask('No encontré ningún vídeo. [B]uscar / [P]egar enlace / [H] no hay / [O]mitir: ')).trim().toLowerCase();
      if (action === 'b') { query = (await ask('Texto para buscar: ')).trim() || title; continue; }
      if (action === 'p') return youtubeChoice(await ask('Enlace de YouTube / escribe “no hay”: '));
      return ['h', 'no hay', 'nohay'].includes(action) ? { listen: '', pending: true } : { listen: '', pending: false };
    }

    const first = videos[0];
    console.log(`✓ Vídeo encontrado y añadido: ${first.title}`);
    return { listen: first.url, pending: false };
  }
}

function htmlDecode(value) {
  return value.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
}

function jsonString(value) {
  try { return JSON.parse(`"${value}"`); } catch { return value; }
}

function firstJsonValue(html, fields) {
  for (const field of fields) {
    const match = html.match(new RegExp(`\\"${field}\\"\\s*:\\s*\\"((?:\\\\.|[^\\"])*)\\"`, 'i'));
    if (match) return jsonString(match[1]);
  }
  return '';
}

async function soundCloudInfo(source) {
  const requested = validUrl(source, 'El enlace de SoundCloud');
  let response;
  try {
    response = await fetch(requested, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' } });
  } catch {
    throw new Error('No se pudo conectar con SoundCloud. Comprueba tu conexión e inténtalo de nuevo.');
  }
  if (!response.ok) throw new Error(`SoundCloud respondió con ${response.status}.`);
  const finalUrl = new URL(response.url);
  if (!/(^|\.)soundcloud\.com$/i.test(finalUrl.hostname)) throw new Error('El enlace no lleva a una página de SoundCloud.');
  const html = await response.text();
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  const cover = ogImage ? htmlDecode(ogImage[1]) : firstJsonValue(html, ['artwork_url', 'avatar_url']);
  const buy = firstJsonValue(html, ['purchase_url', 'buy_link']);
  if (!cover) throw new Error('No se encontró una portada en esa página de SoundCloud.');
  return { cover: validUrl(cover, 'La portada de SoundCloud'), buy: buy ? validUrl(buy, 'El enlace Buy de SoundCloud') : '' };
}

function extensionFrom(url, contentType) {
  const type = (contentType || '').split(';')[0].toLowerCase();
  const byType = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[type];
  if (byType) return byType;
  const extension = path.extname(new URL(url).pathname).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension) ? extension : '.jpg';
}

async function copyRemoteCover(url, destinationBase) {
  let response;
  try {
    response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' } });
  } catch {
    throw new Error('No se pudo descargar la portada de SoundCloud.');
  }
  if (!response.ok) throw new Error(`No se pudo descargar la portada (${response.status}).`);
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.toLowerCase().startsWith('image/')) throw new Error('SoundCloud no devolvió una imagen como portada.');
  const data = Buffer.from(await response.arrayBuffer());
  if (!data.length) throw new Error('La portada de SoundCloud está vacía.');
  const destination = `${destinationBase}${extensionFrom(response.url, contentType)}`;
  await fs.writeFile(destination, data);
  return path.basename(destination);
}

async function localCover(destinationBase) {
  const coverPath = cleanPath(await ask('Arrastra aquí la PORTADA (JPG/PNG/WebP) y pulsa Enter: '));
  if (!coverPath) throw new Error('Necesitas indicar una portada.');
  await fs.access(coverPath);
  const extension = path.extname(coverPath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension)) throw new Error('La portada debe ser JPG, PNG, WebP o GIF.');
  const destination = `${destinationBase}${extension}`;
  await fs.copyFile(coverPath, destination);
  return path.basename(destination);
}

function cleanImportedTitle(value) {
  return value.replace(/^[-*•\d.)\s]+/, '').replace(/[\s(\[]+$/, '').trim();
}

function soundCloudUrls(value) {
  return [...new Set(value.match(/https?:\/\/(?:on\.)?soundcloud\.com\/[^\s\])}]+/gi) || [])];
}

function parseMashupList(value) {
  const items = [];
  let pendingTitle = '';
  for (const rawLine of value.replace(/\r/g, '').split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const urls = soundCloudUrls(line);
    if (!urls.length) {
      pendingTitle = cleanImportedTitle(line);
      continue;
    }
    const titleOnLine = cleanImportedTitle(line.slice(0, line.indexOf(urls[0])));
    const title = titleOnLine || pendingTitle;
    if (title) items.push({ title, soundCloudUrl: urls[0] });
    pendingTitle = '';
  }
  return items;
}

async function addMashup({ importedTitle = '', soundCloudUrl: importedSoundCloudUrl = '' } = {}) {
  console.log('\nDatos del mashup');
  const title = importedTitle || (await ask('Título: ')).trim();
  if (!title) throw new Error('Necesitas escribir un título.');
  if (importedTitle) console.log(`Título importado: ${title}`);
  const youtube = await chooseYouTubeVideo(title);
  const previewPath = cleanPath(await ask('Arrastra el AUDIO PREVIEW (opcional) y pulsa Enter: '));
  if (previewPath) await fs.access(previewPath);

  console.log('\nPortada y enlace de descarga');
  const soundCloudUrl = importedSoundCloudUrl || (await ask('Pega el enlace de SoundCloud (Enter para arrastrar una portada): ')).trim();
  if (importedSoundCloudUrl) console.log(`SoundCloud importado: ${soundCloudUrl}`);

  await fs.mkdir(assets, { recursive: true });
  const slug = `${slugify(title) || 'mashup'}-${Date.now()}`;
  const coverBase = path.join(assets, `${slug}-cover`);
  let coverName;
  let download = '';
  if (soundCloudUrl) {
    console.log('Buscando la portada y el enlace Buy en SoundCloud…');
    const info = await soundCloudInfo(soundCloudUrl);
    coverName = await copyRemoteCover(info.cover, coverBase);
    download = info.buy;
    console.log(download ? '✓ Enlace Buy encontrado: se usará en el botón Descargar.' : '⚠ No hay enlace Buy en SoundCloud; el botón Descargar quedará desactivado.');
  } else {
    coverName = await localCover(coverBase);
    download = validUrl((await ask('Enlace de descarga/Buy (opcional): ')).trim(), 'El enlace de descarga');
  }

  let previewName = '';
  if (previewPath) {
    const extension = path.extname(previewPath).toLowerCase();
    if (!['.mp3', '.m4a', '.wav', '.ogg'].includes(extension)) throw new Error('El preview debe ser MP3, M4A, WAV u OGG.');
    previewName = `${slug}-preview${extension}`;
    await fs.copyFile(previewPath, path.join(assets, previewName));
  }

  const buttonColors = downloadColors(await ask('Colores del botón Descargar (opcional; 2 o 3 hex separados por comas, ej. 1677ff, ff5426): '));

  const entries = JSON.parse(await fs.readFile(database, 'utf8'));
  entries.unshift({ title, listen: youtube.listen, youtubePending: youtube.pending, publishedAt: new Date().toISOString(), download, cover: `../mashups/assets/${coverName}`, preview: previewName ? `../mashups/assets/${previewName}` : '', ...(buttonColors.length ? { downloadColors: buttonColors } : {}) });
  await fs.writeFile(database, `${JSON.stringify(entries, null, 2)}\n`);
  await fs.writeFile(browserData, `window.DJGEEORGE_MASHUPS = ${JSON.stringify(entries, null, 2)};\n${browserStyle}\n`);
  console.log(`\n✓ “${title}” añadido. La portada${soundCloudUrl ? ' y el enlace Buy vienen de SoundCloud' : ''}.\n`);
}

async function saveEntries(entries) {
  await fs.writeFile(database, `${JSON.stringify(entries, null, 2)}\n`);
  await fs.writeFile(browserData, `window.DJGEEORGE_MASHUPS = ${JSON.stringify(entries, null, 2)};\n${browserStyle}\n`);
}

async function editMashup() {
  const entries = JSON.parse(await fs.readFile(database, 'utf8'));
  if (!entries.length) throw new Error('No hay mashups para editar.');
  console.log('\n--- Editar mashup ---\n');
  entries.forEach((entry, index) => console.log(`${index + 1}. ${entry.title}`));
  const number = Number((await ask('\nNúmero del mashup a editar: ')).trim());
  if (!Number.isInteger(number) || number < 1 || number > entries.length) throw new Error('Elige un número válido de la lista.');
  const entry = entries[number - 1];
  console.log('\nPulsa Enter en un campo para conservar su valor actual.');

  const title = (await ask(`Título [${entry.title}]: `)).trim() || entry.title;
  const youtubeValue = (await ask(`Enlace YouTube [${entry.listen || 'sin vídeo'}] ("no hay" para próximo): `)).trim();
  if (youtubeValue) {
    const youtube = youtubeChoice(youtubeValue);
    entry.listen = youtube.listen;
    entry.youtubePending = youtube.pending;
  }

  const soundCloudUrl = (await ask('Nuevo enlace de SoundCloud (Enter para conservar portada/Buy): ')).trim();
  let coverWasUpdated = false;
  if (soundCloudUrl) {
    console.log('Actualizando portada y enlace Buy desde SoundCloud…');
    const info = await soundCloudInfo(soundCloudUrl);
    const slug = `${slugify(title) || 'mashup'}-${Date.now()}`;
    const coverName = await copyRemoteCover(info.cover, path.join(assets, `${slug}-cover`));
    entry.cover = `../mashups/assets/${coverName}`;
    entry.download = info.buy;
    coverWasUpdated = true;
    console.log(entry.download ? '✓ Portada y enlace Buy actualizados.' : '✓ Portada actualizada; no hay enlace Buy en SoundCloud.');
  }

  const coverChoice = (await ask('Portada: [1] conservar / [2] arrastrar portada personalizada: ')).trim();
  if (coverChoice === '2') {
    const slug = `${slugify(title) || 'mashup'}-${Date.now()}`;
    const coverName = await localCover(path.join(assets, `${slug}-cover`));
    entry.cover = `../mashups/assets/${coverName}`;
    coverWasUpdated = true;
  } else if (coverChoice && coverChoice !== '1') throw new Error('Elige 1, 2 o pulsa Enter.');

  entry.title = title;
  await saveEntries(entries);
  console.log(`\n✓ “${entry.title}” actualizado.${coverWasUpdated ? ' La portada nueva ya está guardada.' : ''}\n`);
}

async function importMashupsFromClipboard() {
  console.log('\nCopia el bloque de tu bloc de notas y vuelve aquí.');
  await ask('Pulsa Enter cuando lo tengas copiado: ');
  let text;
  try {
    text = await readClipboard();
  } catch {
    throw new Error('No pude leer el portapapeles. Copia el bloque e inténtalo de nuevo.');
  }
  const items = parseMashupList(text);
  if (!items.length) throw new Error('No encontré pares de título y enlace de SoundCloud en el texto copiado.');
  console.log(`\nHe encontrado ${items.length} mashup${items.length === 1 ? '' : 's'}:`);
  items.forEach((item, index) => console.log(`  ${index + 1}. ${item.title}`));
  const confirm = (await ask('¿Importar esta lista? (s/n): ')).trim().toLowerCase();
  if (!['s', 'si', 'sí'].includes(confirm)) return;

  let completed = 0;
  for (const [index, item] of items.entries()) {
    console.log(`\n--- ${index + 1} de ${items.length} ---`);
    try {
      await addMashup({ importedTitle: item.title, soundCloudUrl: item.soundCloudUrl });
      completed += 1;
    } catch (error) {
      console.error(`\nNo se pudo importar “${item.title}”: ${error.message}\n`);
    }
  }
  console.log(`\n✓ Importación terminada: ${completed} de ${items.length} mashups añadidos.\n`);
}

console.log('\n--- Añadir mashups DJgeeorge ---');
try {
  console.log('\n1) Añadir un mashup');
  console.log('2) Importar una lista en bloque desde el portapapeles');
  console.log('3) Editar un mashup existente');
  const mode = (await ask('Elige 1, 2 o 3: ')).trim();
  if (mode === '1') {
    let addAnother = 's';
    while (['s', 'si', 'sí'].includes(addAnother)) {
      try { await addMashup(); }
      catch (error) { console.error(`\nNo se pudo añadir el mashup: ${error.message}\n`); }
      addAnother = (await ask('¿Quieres añadir otra mezcla? (s/n): ')).trim().toLowerCase();
    }
  } else if (mode === '2') {
    await importMashupsFromClipboard();
  } else if (mode === '3') {
    await editMashup();
  } else {
    console.log('\nNo se ha añadido nada.');
  }
  console.log('\n✓ Todo guardado. Ya puedes cerrar esta ventana.\n');
} finally { await rl.close(); }
