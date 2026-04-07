const elements = [
  document.getElementById('name'),
  document.getElementById('header-name')
].filter(Boolean);

window.addEventListener('mousemove', (e) => {
  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    el.style.setProperty('--x', x + '%');
    el.style.setProperty('--y', y + '%');
  });
});