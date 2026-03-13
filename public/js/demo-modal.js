(function () {
  'use strict';
  console.info('demo-modal: init');

  function createOverlay(url, title) {
    const prevFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'demo-overlay';
    overlay.tabIndex = -1;

    const modal = document.createElement('div');
    modal.className = 'demo-modal';

    const header = document.createElement('div');
    header.className = 'demo-header';
    const h = document.createElement('div');
    h.className = 'demo-title';
    h.textContent = title || url;

    const btn = document.createElement('button');
    btn.className = 'demo-close';
    btn.setAttribute('aria-label', 'Close demo');
    btn.innerHTML = '✕';

    header.appendChild(h);
    header.appendChild(btn);

    const frame = document.createElement('iframe');
    frame.className = 'demo-frame';
    frame.src = url;
    frame.title = title || 'Demo';
    frame.setAttribute('allow', 'clipboard-read; clipboard-write; accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');

    modal.appendChild(header);
    modal.appendChild(frame);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function close() {
      document.body.style.overflow = '';
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.removeEventListener('keydown', onKey);
      overlay.removeEventListener('pointerdown', onPointer);
      try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    function onPointer(e) {
      if (!modal.contains(e.target)) close();
    }
    btn.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('pointerdown', onPointer);
    overlay.focus();
    return { overlay, close, frame };
  }

  function findDemoLinkFromEvent(e) {
    let target = e.target;
    if (target && target.nodeType === 3) target = target.parentElement;

    if (target && target.closest) {
      const a = target.closest('.demo-link');
      if (a) return a;
    }

    if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
      try {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.closest) {
          const a2 = el.closest('.demo-link');
          if (a2) return a2;
        }
      } catch (err) {
      }
    }

    if (target && target.closest) {
      const card = target.closest('.project-card, .card, .project');
      if (card) {
        const q = card.querySelector && card.querySelector('.demo-link');
        if (q) return q;
      }
    }

    return null;
  }

  function openInNewTab(url) {
    try {
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      window.location.href = url;
    }
  }

  function handleClick(e) {
    const a = findDemoLinkFromEvent(e);
    if (!a) return;

    const url = (a.dataset && a.dataset.demo) ? a.dataset.demo : a.href;
    if (!url) return;

    const wantNewTab = (e.button && e.button !== 0) || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
    if (wantNewTab) {
      openInNewTab(url);
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      return;
    }

    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();

    createOverlay(url, a.getAttribute('aria-label') || a.textContent || 'Demo');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const el = document.activeElement;
      if (!el) return;
      if (el.classList && el.classList.contains('demo-link')) {
        el.click();
        e.preventDefault();
        return;
      }
      const maybeLink = el.closest && el.closest('.project-card, .card, .project');
      if (maybeLink) {
        const inside = maybeLink.querySelector && maybeLink.querySelector('.demo-link');
        if (inside) {
          inside.click();
          e.preventDefault();
        }
      }
    }
  }

  document.addEventListener('click', handleClick, { capture: true, passive: false });
  document.addEventListener('keydown', handleKeyDown, { capture: true });

  console.info('demo-modal: ready (capture listener)');
})();
