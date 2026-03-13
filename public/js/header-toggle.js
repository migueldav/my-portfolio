(function(){
'use strict';
const header = document.querySelector('.site-header');
const navLinks = Array.from(document.querySelectorAll('.site-header .nav a'));
const idToLink = {};
navLinks.forEach(a => {
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#') && href.length > 1) idToLink[href.slice(1)] = a;
});
let sections = [];
let observer = null;
const ratios = new Map();
let currentActiveId = null;
let pendingActiveId = null;
let pendingTimer = null;
const HYSTERESIS_DELAY = 120;
function getHeaderHeight(){
  if (header && header.offsetHeight) return header.offsetHeight;
  const cssVal = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
  const num = parseInt(cssVal, 10);
  return isNaN(num) ? 64 : num;
}
function buildObserver(){
  if (observer) observer.disconnect();
  const headerHeight = getHeaderHeight();
  const marginPx = Math.round(headerHeight + 18);
  const opts = {
    root: null,
    threshold: Array.from({length:21}, (_, i) => i/20),
    rootMargin: `-${marginPx}px 0px -${marginPx}px 0px`
  };
  observer = new IntersectionObserver(onIntersect, opts);
  sections.forEach(s => {
    ratios.set(s.id, 0);
    observer.observe(s);
  });
}
function refreshSections(){
  sections = Object.keys(idToLink).map(id => document.getElementById(id)).filter(Boolean);
  sections = sections.sort((a,b) => (a.offsetTop || 0) - (b.offsetTop || 0));
  buildObserver();
}
function clearActive(){
  Object.values(idToLink).forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
  currentActiveId = null;
}
function commitActiveById(id){
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingActiveId = null;
  }
  clearActive();
  const link = idToLink[id];
  if (link) {
    link.classList.add('active');
    link.setAttribute('aria-current','true');
    currentActiveId = id;
  } else {
    currentActiveId = null;
  }
}
function scheduleActiveChange(candidateId){
  if (candidateId === currentActiveId){
    if (pendingTimer){ clearTimeout(pendingTimer); pendingTimer = null; pendingActiveId = null; }
    return;
  }
  if (pendingActiveId === candidateId) return;
  if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; pendingActiveId = null; }
  pendingActiveId = candidateId;
  pendingTimer = setTimeout(() => {
    if (!window.__scrollLock) commitActiveById(pendingActiveId);
    pendingActiveId = null;
    pendingTimer = null;
  }, HYSTERESIS_DELAY);
}
function setActiveByIdImmediate(id){
  if (pendingTimer){ clearTimeout(pendingTimer); pendingTimer = null; pendingActiveId = null; }
  commitActiveById(id);
}
function pickBestSection(){
  if (window.__scrollLock) return;
  const headerHeight = getHeaderHeight();
  const anchorLine = headerHeight + 8;
  const hero = document.getElementById('hero');
  if (hero){
    const hb = hero.getBoundingClientRect().bottom;
    if (hb > headerHeight + 110){
      clearActive();
      return;
    }
  }
  for (const s of sections){
    const rect = s.getBoundingClientRect();
    if (rect.top <= anchorLine && rect.bottom > anchorLine) {
      if (s.id) { scheduleActiveChange(s.id); return; }
    }
  }
  let bestId = null;
  let bestRatio = -1;
  for (const [id, r] of ratios.entries()){
    if (r > bestRatio){
      bestRatio = r;
      bestId = id;
    }
  }
  if (bestId && bestRatio > 0.06) {
    scheduleActiveChange(bestId);
    return;
  }
  const viewportCenter = window.innerHeight / 2;
  let bestScore = Infinity;
  let bestElem = null;
  for (const s of sections){
    const rect = s.getBoundingClientRect();
    const center = rect.top + rect.height/2;
    const score = Math.abs(center - viewportCenter);
    if (score < bestScore){
      bestScore = score;
      bestElem = s;
    }
  }
  if (bestElem && bestElem.id) scheduleActiveChange(bestElem.id);
}
function onIntersect(entries){
  entries.forEach(e => {
    const id = e.target.id;
    ratios.set(id, e.intersectionRatio);
  });
  pickBestSection();
}
function initHeaderVisibility(){
  if (header) header.classList.add('visible');
}
window.addEventListener('load', () => {
  refreshSections();
  if (location.hash && idToLink[location.hash.slice(1)]){
    setActiveByIdImmediate(location.hash.slice(1));
    setTimeout(() => pickBestSection(), 150);
    return;
  }
  pickBestSection();
});
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    refreshSections();
    pickBestSection();
  }, 120);
});
navLinks.forEach(a => {
  a.addEventListener('click', () => {
    setActiveByIdImmediate(a.getAttribute('href').replace(/^#/, ''));
    if (window.__engageScrollLock) window.__engageScrollLock();
  });
});
initHeaderVisibility();
refreshSections();
})();
