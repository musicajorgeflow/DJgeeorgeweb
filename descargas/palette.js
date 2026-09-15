(() => {
  const slug = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const gradients = {
    'de-lejitos-remix-x-love': 'linear-gradient(120deg,#737373,#8b5cf6)',
    'caliente-x-8-cositas': 'linear-gradient(120deg,#ff3131,#ff77b7)',
    'pa-ti-toa-x-despecha': 'linear-gradient(120deg,#2997ff,#ff6fcf)',
    'aire-x-columbia-x-limbo': 'linear-gradient(120deg,#ff3131,#ffd43b,#ff6fcf)',
    'playa-x-playa-djgeeorge-emotional-edit': 'linear-gradient(120deg,#09090b,#e59b31)',
    'quiero-mas-x-pinky-promise-2': 'linear-gradient(120deg,#ffd43b,#fffef5)',
    'gout-djgeeorge-techno-remix': 'linear-gradient(120deg,#f8faff,#4da3ff)',
    'no-me-guillo-v2-x-coachella': 'linear-gradient(120deg,#ff5ebc,#09090b)',
    'no-me-guillo-v2-x-galdar': 'linear-gradient(120deg,#ff74be,#ff9d35)',
    'no-me-guillo-v2-x-baby-lover': 'linear-gradient(120deg,#f4a7cf,#24101d)',
    'no-me-guillo-v2-x-moscow-mule': 'linear-gradient(120deg,#ff4b5c,#ffd166)'
  };
  const defaultGradient = 'linear-gradient(120deg,#09090b,#ff3128)';
  const run = () => document.querySelectorAll('.card').forEach(card => {
    const button = card.querySelector('.action.download:not(.disabled)');
    if (!button) return;
    const id = card.id.replace('mashup-', '');
    const colors = (window.DJGEEORGE_MASHUPS || []).find(item => slug(item.title) === id)?.downloadColors;
    button.style.background = Array.isArray(colors) && colors.length >= 2
      ? `linear-gradient(120deg,${colors.join(',')})`
      : gradients[id] || defaultGradient;
    button.style.color = '#fff';
    button.style.textShadow = '0 1px 8px #0008';
  });
  if (document.readyState === 'complete') run();
  else addEventListener('load', run, { once: true });
})();
