// Los cinco últimos TikToks. La web inserta el reproductor oficial en pausa para usar su frame real como portada.
window.DJGEEORGE_TIKTOKS = [
  { title: 'De Lejitos X Love', id: '7680698434055163158', cover: '', url: 'https://www.tiktok.com/@djgeeorge/video/7680698434055163158' },
  { title: '8 Cositas X Caliente', id: '7680196130294074646', cover: '', url: 'https://www.tiktok.com/@djgeeorge/video/7680196130294074646' },
  { title: 'After X Trending', id: '7679831819142958358', cover: '', url: 'https://www.tiktok.com/@djgeeorge/video/7679831819142958358' },
  { title: 'Muchacha X Maladie', id: '7685753784164732192', cover: '', url: 'https://www.tiktok.com/@djgeeorge/video/7685753784164732192' },
  { title: 'Galdar X Resentia', id: '7685011047018663200', cover: '', url: 'https://www.tiktok.com/@djgeeorge/video/7685011047018663200' }
];

document.head.insertAdjacentHTML('beforeend', '<style>.tiktok-card .tiktok-player{display:block;width:100%;aspect-ratio:9/14;border:0;background:#17131f}.tiktok-card>img{display:none}</style>');
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.tiktok-card').forEach((card,index)=>{const video=window.DJGEEORGE_TIKTOKS[index];if(!video?.id)return;const frame=document.createElement('iframe');frame.className='tiktok-player';frame.loading='lazy';frame.title=video.title;frame.src=`https://www.tiktok.com/player/v1/${video.id}?autoplay=0&controls=0&description=0&music_info=0`;frame.allow='fullscreen';card.querySelector('img')?.replaceWith(frame)})});
