(function(){
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LOCK_TIMEOUT = 900;
  window.__scrollLock = window.__scrollLock || false;

  function getAnchorTarget(anchor){
    try{
      const href = anchor.getAttribute('href');
      if(!href || !href.startsWith('#') || href === '#') return null;
      return document.getElementById(href.slice(1));
    }catch(e){return null;}
  }

  function scrollToElement(target, offset=0){
    if(!target) return;
    const elementTop = target.getBoundingClientRect().top + window.pageYOffset;
    const targetPos = Math.max(0, elementTop - offset);
    if(reduceMotion){
      window.scrollTo(0, targetPos);
    }else{
      window.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
  }

  function clearActive(navLinks){
    navLinks.forEach(a => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
  }
  function setActiveLink(anchor){
    anchor.classList.add('active');
    anchor.setAttribute('aria-current','true');
  }

  function engageLock(){
    window.__scrollLock = true;
    clearTimeout(window.__scrollLockTimer);
    window.__scrollLockTimer = setTimeout(() => {
      window.__scrollLock = false;
    }, LOCK_TIMEOUT);
  }

  document.addEventListener('click', ev => {
    const anchor = ev.target.closest && ev.target.closest('a[href^="#"]');
    if(!anchor) return;
    const target = getAnchorTarget(anchor);
    if(!target) return;
    ev.preventDefault();

    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const dataOffset = anchor.getAttribute('data-scroll-offset');
    const extraOffset = dataOffset ? (parseInt(dataOffset,10) || 0) : 0;
    const totalOffset = headerHeight + extraOffset;

    engageLock();

    scrollToElement(target, totalOffset);

    const navLinks = Array.from(document.querySelectorAll('.site-header .nav a[href^="#"]'));
    clearActive(navLinks);
    if(navLinks.includes(anchor)) setActiveLink(anchor);

    const href = anchor.getAttribute('href');
    try{
      if(history && history.pushState) history.pushState(null,'',href);
      else location.hash = href;
    }catch(err){}
  });

  window.addEventListener('load', ()=>{
    if(!location.hash) return;
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if(!target) return;
    setTimeout(() => {
      const header = document.querySelector('.site-header');
      const headerHeight = header ? header.offsetHeight : 0;
      engageLock();
      scrollToElement(target, headerHeight);

      const anchor = document.querySelector(`.site-header .nav a[href="#${id}"]`);
      const navLinks = Array.from(document.querySelectorAll('.site-header .nav a[href^="#"]'));
      clearActive(navLinks);
      if(anchor) setActiveLink(anchor);
    }, 60);
  });

  // expor util (opcional) para debug
  window.__engageScrollLock = engageLock;
})();
