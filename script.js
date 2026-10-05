const portrait = document.querySelector('[data-portrait]');
const photo = document.querySelector('[data-hostess-photo]');

if (photo) {
  if (photo.complete && photo.naturalWidth > 0) portrait?.classList.add('photo-ready');
  photo.addEventListener('load', () => portrait?.classList.add('photo-ready'));
  photo.addEventListener('error', () => photo.remove());
}

portrait?.addEventListener('pointermove', (event) => {
  const bounds = portrait.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;
  portrait.style.setProperty('--glow-x', `${x}%`);
  portrait.style.setProperty('--glow-y', `${y}%`);
});
