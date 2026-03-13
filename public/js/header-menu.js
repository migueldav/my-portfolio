(function(){
'use strict';
const btn = document.querySelector('.mobile-toggle');
const nav = document.getElementById('mobile-nav');
const header = document.querySelector('.site-header');
if(!btn || !nav || !header) return;
const focusableSelector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
function setInert(el, value){
  if(!el) return;
  if('inert' in HTMLElement.prototype){
    el.inert = value;
    return;
  }
  const nodes = el.querySelectorAll(focusableSelector);
  nodes.forEach(node => {
    if(value){
      if(node.hasAttribute('tabindex')) node.dataset._prevTab = node.getAttribute('tabindex');
      node.setAttribute('tabindex','-1');
    } else {
      if(node.dataset && node.dataset._prevTab !== undefined){
        node.setAttribute('tabindex', node.dataset._prevTab);
        delete node.dataset._prevTab;
      } else {
        node.removeAttribute('tabindex');
      }
    }
  });
}
function openMenu(){
  btn.setAttribute('aria-expanded','true');
  btn.setAttribute('aria-label','Fechar menu');
  nav.classList.add('open');
  nav.removeAttribute('aria-hidden');
  setInert(nav, false);
  header.classList.add('nav-open');
  document.body.style.overflow = 'hidden';
  const first = nav.querySelector(focusableSelector);
  if(first) first.focus();
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('pointerdown', onPointerDown, true);
}
function closeMenu(){
  btn.setAttribute('aria-expanded','false');
  btn.setAttribute('aria-label','Abrir menu');
  nav.classList.remove('open');
  nav.setAttribute('aria-hidden','true');
  setInert(nav, true);
  header.classList.remove('nav-open');
  document.body.style.overflow = '';
  btn.focus();
  document.removeEventListener('focusin', onFocusIn, true);
  document.removeEventListener('pointerdown', onPointerDown, true);
}
function onFocusIn(e){
  if(nav.getAttribute('aria-hidden') === 'true' && nav.contains(e.target)){
    e.preventDefault();
    e.target.blur();
    btn.focus();
  }
}
function onPointerDown(e){
  if(nav.getAttribute('aria-hidden') === 'true') return;
  const t = e.target;
  if(nav.contains(t) || btn.contains(t)) return;
  closeMenu();
}
btn.addEventListener('click', () => {
  if (btn.getAttribute('aria-expanded') === 'true') closeMenu(); else openMenu();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
nav.addEventListener('click', (e) => { if (e.target && e.target.matches('a')) closeMenu(); });
if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded','false');
if (!btn.hasAttribute('aria-label')) btn.setAttribute('aria-label','Abrir menu');
if (window.matchMedia('(min-width: 600px)').matches){
  nav.removeAttribute('aria-hidden');
  setInert(nav, false);
} else {
  nav.setAttribute('aria-hidden','true');
  setInert(nav, true);
}
})();