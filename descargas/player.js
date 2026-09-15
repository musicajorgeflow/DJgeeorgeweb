(() => {
  const safe = value => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const time = value => {
    if (!Number.isFinite(value) || value < 0) return '0:00';
    const minutes = Math.floor(value / 60);
    return `${minutes}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  };
  const playerColors = ['#3da5ff', '#ff5f88', '#b981ff', '#ff9d3d', '#47d6ad', '#ffce4a', '#73a3ff', '#f275d5', '#9cdb61', '#ff7458', '#54d7e8', '#e78bff'];
  const slug = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const markup = source => `<div class="dj-player"><button class="dj-player-play" type="button" aria-label="Reproducir preview"><span aria-hidden="true">▶</span></button><div class="dj-player-track"><input class="dj-player-progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="Progreso del preview"><div class="dj-player-time"><span class="dj-player-current">0:00</span><span class="dj-player-duration">0:00</span></div></div><audio class="dj-audio" preload="metadata" src="${safe(source)}"></audio></div>`;
  const setup = card => {
    const player = card.querySelector('.dj-player');
    if (!player) return;
    const mashups = window.DJGEEORGE_MASHUPS || [];
    const index = mashups.findIndex(item => slug(item.title) === card.id.replace('mashup-', ''));
    const customColor = mashups[index]?.downloadColors?.[0];
    player.style.setProperty('--player-progress', customColor || playerColors[(index < 0 ? 0 : index) % playerColors.length]);
    const audio = player.querySelector('.dj-audio');
    const button = player.querySelector('.dj-player-play');
    const icon = button.querySelector('span');
    const progress = player.querySelector('.dj-player-progress');
    const current = player.querySelector('.dj-player-current');
    const duration = player.querySelector('.dj-player-duration');
    const update = () => {
      const percent = audio.duration ? Math.min(100, audio.currentTime / audio.duration * 100) : 0;
      progress.value = percent;
      progress.style.setProperty('--progress', `${percent}%`);
      current.textContent = time(audio.currentTime);
      duration.textContent = time(audio.duration);
    };
    button.addEventListener('click', () => { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); });
    progress.addEventListener('input', () => { if (audio.duration) audio.currentTime = audio.duration * (Number(progress.value) / 100); });
    audio.addEventListener('play', () => { document.querySelectorAll('.dj-audio').forEach(other => { if (other !== audio) other.pause(); }); player.classList.add('is-playing'); icon.textContent = 'Ⅱ'; button.setAttribute('aria-label', 'Pausar preview'); });
    audio.addEventListener('pause', () => { player.classList.remove('is-playing'); icon.textContent = '▶'; button.setAttribute('aria-label', 'Reproducir preview'); });
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', update);
  };
  window.DJGEEORGE_PLAYER = { markup, setup };
})();
