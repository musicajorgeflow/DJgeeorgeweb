(() => {
  const items = window.DJGEEORGE_MASHUPS || [];
  const site = 'https://djgeeorge.qd.je/descargas/';
  const slug = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const publishedAt = item => {
    const declared = Date.parse(item.publishedAt || '');
    const inFilename = Number((item.cover || '').match(/-(\d{13})-cover\./)?.[1]);
    return Number.isFinite(declared) ? declared : inFilename;
  };
  const isNew = item => {
    const date = publishedAt(item);
    return Number.isFinite(date) && date <= Date.now() && Date.now() - date < 14 * 24 * 60 * 60 * 1000;
  };

  items.forEach(item => {
    const card = document.getElementById(`mashup-${slug(item.title)}`);
    if (!card) return;

    if (isNew(item)) {
      const badge = document.createElement('span');
      badge.className = 'new-badge';
      badge.textContent = 'Nuevo';
      card.querySelector('.cover')?.append(badge);
    }

    const actions = card.querySelector('.actions');
    const share = actions?.querySelector('.share');
    if (!actions || !share) return;
    const copy = document.createElement('button');
    copy.className = 'action copy';
    copy.type = 'button';
    copy.textContent = 'Copiar enlace';
    copy.addEventListener('click', async () => {
      const link = `${site}?m=${encodeURIComponent(slug(item.title))}`;
      const showCopied = () => {
        copy.textContent = 'Enlace copiado ✓';
        copy.classList.add('is-copied');
        window.setTimeout(() => {
          copy.textContent = 'Copiar enlace';
          copy.classList.remove('is-copied');
        }, 2200);
      };
      const fallbackCopy = () => {
        const fallback = document.createElement('textarea');
        fallback.value = link;
        fallback.readOnly = true;
        fallback.style.position = 'fixed';
        fallback.style.opacity = '0';
        document.body.append(fallback);
        fallback.select();
        document.execCommand('copy');
        fallback.remove();
      };
      try {
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).catch(fallbackCopy);
        else fallbackCopy();
      } catch {
        fallbackCopy();
      }
      showCopied();
    });
    actions.insertBefore(copy, share);
  });

  const latestVideo = items.find(item => item.listen && !item.youtubePending);
  const section = document.querySelector('#latest-video');
  if (!latestVideo || !section) return;
  const link = section.querySelector('#latest-video-link');
  const image = section.querySelector('#latest-video-cover');
  const title = section.querySelector('#latest-video-title');
  link.href = latestVideo.listen;
  image.src = latestVideo.cover;
  image.alt = `Portada de ${latestVideo.title}`;
  title.textContent = latestVideo.title;
  section.hidden = false;
})();
