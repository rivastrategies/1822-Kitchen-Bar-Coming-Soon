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
  portrait.style.setProperty('--shift-x', `${(x - 50) * -0.045}px`);
  portrait.style.setProperty('--shift-y', `${(y - 50) * -0.035}px`);
});

portrait?.addEventListener('pointerleave', () => {
  portrait.style.setProperty('--glow-x', '66%');
  portrait.style.setProperty('--glow-y', '30%');
  portrait.style.setProperty('--shift-x', '0px');
  portrait.style.setProperty('--shift-y', '0px');
});
