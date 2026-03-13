/* carousel.js — versão corrigida (restaura transitions e adiciona matchMedia) */
document.addEventListener('DOMContentLoaded', function(){
  const roots = document.querySelectorAll('[data-carousel-root]');
  if(!roots.length) return;

  roots.forEach(root => {
    const filterWrap = root.querySelector('.projects-filter-wrap');
    const wrapper = root.querySelector('.projects-wrapper');
    const grid = root.querySelector('.projects-grid');

    if(!grid || !filterWrap || !wrapper) return;

    let carousel = null;
    let state = { slidesToShow: 1, index: 0 };
    let isUpdating = false;
    let obsDebounce = null;
    let mo = null;
    let carouselVisibleIds = [];
    const OBS_DEBOUNCE_MS = 150;
    const RESIZE_DEBOUNCE_MS = 120;
    const UPDATE_TRANSITION_MS = 200;
    const MAX_CLONED_SLIDES = 48;
    const SLIDE_PADDING = '0 0.5rem';

    function calcSlidesToShow(){
      const w = window.innerWidth;
      if(w >= 1200) return 3;
      if(w >= 800) return 2;
      return 1;
    }

    // visibilidade baseada em classe/atributo (não offsetParent)
    function visibleItemsFromGrid(limit = Infinity){
      const nodes = Array.from(grid.querySelectorAll('.project-item'));
      const out = [];
      for(let i=0;i<nodes.length && out.length<limit;i++){
        const el = nodes[i];
        if(el.classList.contains('is-hidden') || el.getAttribute('aria-hidden') === 'true') continue;
        const inlineDisplay = el.style && el.style.display;
        if(inlineDisplay === 'none') continue;
        out.push(el);
      }
      return out;
    }

    function createCarouselStructure(){
      const viewport = document.createElement('div');
      viewport.className = 'carousel-viewport';
      const track = document.createElement('div');
      track.className = 'carousel-track';
      track.style.gap = '0';
      track.style.boxSizing = 'border-box';
      viewport.appendChild(track);

      const prev = document.createElement('button');
      prev.className = 'carousel-btn prev';
      prev.setAttribute('aria-label','Anterior');
      prev.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      const next = document.createElement('button');
      next.className = 'carousel-btn next';
      next.setAttribute('aria-label','Próximo');
      next.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      const dots = document.createElement('div');
      dots.className = 'carousel-dots';
      dots.setAttribute('role','tablist');

      const container = document.createElement('div');
      container.className = 'carousel';
      container.appendChild(prev);
      container.appendChild(viewport);
      container.appendChild(next);
      container.appendChild(dots);

      return { container, viewport, track, prev, next, dots };
    }

    function withUpdates(fn){
      isUpdating = true;
      try { fn(); } catch(e){ console.error(e); }
      setTimeout(() => { isUpdating = false; }, 60);
    }

    function hideWrapperDuringUpdate(){
      wrapper.classList.add('carousel-updating');
    }
    function revealWrapperAfterUpdate(){
      setTimeout(() => {
        wrapper.classList.remove('carousel-updating');
      }, UPDATE_TRANSITION_MS);
    }

    // buildSlidesFragment agora usa effectiveSlidesToShow
    function buildSlidesFragment(items, slidesToShow){
      const fragment = document.createDocumentFragment();
      const effective = Math.max(1, Math.min(slidesToShow, items.length || 1));
      const basisPercent = 100 / effective;
      for(const item of items){
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.style.boxSizing = 'border-box';
        slide.style.padding = SLIDE_PADDING;
        // forçar flex inline para evitar conflitos
        slide.style.setProperty('flex', `0 0 ${basisPercent}%`, 'important');

        const clone = item.cloneNode(true);
        clone.style.width = '100%';
        clone.style.boxSizing = 'border-box';

        slide.appendChild(clone);
        fragment.appendChild(slide);
      }
      return fragment;
    }

    function enableCarousel(){
      const visible = visibleItemsFromGrid(Math.min(MAX_CLONED_SLIDES, 200));
      state.slidesToShow = calcSlidesToShow();

      if(!carousel){
        withUpdates(() => {
          carousel = createCarouselStructure();
          wrapper.insertBefore(carousel.container, grid);
          grid.style.display = 'none';
          grid.setAttribute('aria-hidden', 'true');

          const track = carousel.track;
          const clonesCount = Math.min(visible.length || 1, Math.max(state.slidesToShow * 4, MAX_CLONED_SLIDES));
          const toUse = visible.slice(0, clonesCount);
          const fragment = buildSlidesFragment(toUse, state.slidesToShow);
          track.appendChild(fragment);
          carousel.container.style.setProperty('--slides-to-show', state.slidesToShow);

          carouselVisibleIds = toUse.map(it => (it.dataset.projectId || it.getAttribute('data-project-id') || ''));

          initControls();
          update();
          enableDrag(track);

          if (carousel.dots) carousel.dots.style.display = 'none';
        });
        return;
      }

      updateTrackInPlace(visible);
    }

    function destroyCarousel(){
      if(!carousel) return;
      withUpdates(() => {
        const track = carousel.track;
        track.innerHTML = '';
        carousel.container.remove();
        carousel = null;
        grid.style.display = '';
        grid.removeAttribute('aria-hidden');
        state.index = 0;
        carouselVisibleIds = [];
      });
    }

    function update(){
      if(!carousel) return;
      const track = carousel.track;
      const slides = Array.from(track.children);
      const slidesLen = slides.length;
      const denom = Math.max(1, Math.min(state.slidesToShow, slidesLen));
      const maxIndex = Math.max(0, slidesLen - denom);
      if(state.index > maxIndex) state.index = maxIndex;

      // garantir que a transição do transform está ativa (se não houver inline, o CSS entra)
      // mas se houver inline override, deixamos como está. Normalmente depois do fade restauramos.
      const shift = (100 / denom) * state.index;
      track.style.transform = `translateX(-${shift}%)`;

      const hasEnough = slidesLen > denom;
      if(carousel.prev) carousel.prev.style.display = hasEnough ? '' : 'none';
      if(carousel.next) carousel.next.style.display = hasEnough ? '' : 'none';
      if(carousel.dots) carousel.dots.style.display = 'none';
    }

    function prev(){
      if(!carousel) return;
      const track = carousel.track;
      const slides = Array.from(track.children);
      const slidesLen = slides.length;
      const denom = Math.max(1, Math.min(state.slidesToShow, slidesLen));
      const maxIndex = Math.max(0, slidesLen - denom);
      state.index = state.index - 1;
      if(state.index < 0) state.index = maxIndex;
      update();
    }

    function next(){
      if(!carousel) return;
      const track = carousel.track;
      const slides = Array.from(track.children);
      const slidesLen = slides.length;
      const denom = Math.max(1, Math.min(state.slidesToShow, slidesLen));
      const maxIndex = Math.max(0, slidesLen - denom);
      state.index = state.index + 1;
      if(state.index > maxIndex) state.index = 0;
      update();
    }

    function initControls(){
      if(!carousel) return;
      // evitar múltiplos listeners: remover listeners antigos se existirem (pequeno guard)
      if(carousel.prev && !carousel.prev._hasInit){
        carousel.prev.addEventListener('click', prev);
        carousel.prev._hasInit = true;
      }
      if(carousel.next && !carousel.next._hasInit){
        carousel.next.addEventListener('click', next);
        carousel.next._hasInit = true;
      }
    }

    function enableDrag(track){
      let isDragging = false;
      let startX = 0;
      let containerWidth = 0;
      track.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        containerWidth = carousel.viewport.offsetWidth;
        track.style.transition = 'none';
        try{ track.setPointerCapture(e.pointerId); }catch(e){}
      });
      track.addEventListener('pointermove', (e) => {
        if(!isDragging) return;
        const dx = e.clientX - startX;
        const percent = (dx / containerWidth) * 100;
        const slides = Array.from(track.children);
        const denom = Math.max(1, Math.min(state.slidesToShow, slides.length));
        const baseShift = (100 / denom) * state.index;
        track.style.transform = `translateX(-${baseShift - percent}%)`;
      });
      track.addEventListener('pointerup', (e) => {
        if(!isDragging) return;
        isDragging = false;
        const dx = e.clientX - startX;
        const threshold = containerWidth * 0.15;
        track.style.transition = '';
        try{ track.releasePointerCapture(e.pointerId); }catch(e){}
        if(Math.abs(dx) > threshold){
          if(dx < 0) next();
          else prev();
        } else {
          update();
        }
      });
      track.addEventListener('pointercancel', () => {
        isDragging = false;
        track.style.transition = '';
        update();
      });
    }

    function arraysEqual(a, b){
      if(a.length !== b.length) return false;
      for(let i=0;i<a.length;i++) if(a[i] !== b[i]) return false;
      return true;
    }

    // atualiza o track em-place com fade, sem destruir container
    function updateTrackInPlace(newVisible){
      if(!carousel) return;
      const track = carousel.track;

      const slidesCount = Math.max(newVisible.length, 1);
      const clonesCount = Math.min(slidesCount, Math.max(state.slidesToShow * 4, MAX_CLONED_SLIDES));
      const toUse = newVisible.slice(0, clonesCount);

      const newIds = toUse.map(it => (it.dataset.projectId || it.getAttribute('data-project-id') || ''));

      if(arraysEqual(newIds, carouselVisibleIds)){
        // mesmos ids -> só atualiza posicionamento
        update();
        return;
      }

      // salvar transition anterior (se houver inline)
      const prevTransition = track.style.transition || '';

      // aplicar apenas opacity para fade-out
      track.style.transition = 'opacity 120ms ease';
      // força reflow para garantir que a mudança de transition foi aplicada antes de alterar opacity
      void track.offsetWidth;
      track.style.opacity = '0';

      setTimeout(() => {
        // rebuild do conteúdo
        track.innerHTML = '';
        const frag = buildSlidesFragment(toUse, state.slidesToShow);
        track.appendChild(frag);
        // manter var com o valor "desejado" (1/2/3)
        carousel.container.style.setProperty('--slides-to-show', state.slidesToShow);
        carouselVisibleIds = newIds;

        // forçar reflow antes de restaurar transitions (importante)
        void track.offsetWidth;

        // restaurar transition para incluir transform e opacity (ou prev se existia)
        if(prevTransition && prevTransition.trim() !== '') {
          // se tinha um transition inline, restauramos (preserva comportamento custom)
          track.style.transition = prevTransition;
        } else {
          // caso contrário, setamos uma combinação explícita que coincide com o CSS
          track.style.transition = 'transform .60s cubic-bezier(.2,.9,.2,1), opacity 120ms ease';
        }

        // forçar reflow mais uma vez para garantir browser aplica a transition restaurada
        void track.offsetWidth;

        // fade in
        track.style.opacity = '';

        // ajustar index e reposicionar (com animação de transform ativa)
        state.index = 0;
        update();
      }, 140);
    }

    function rebuild(){
      if(isUpdating) return;

      const newSlidesToShow = calcSlidesToShow();
      const visible = visibleItemsFromGrid();
      const visibleIds = visible.map(it => (it.dataset.projectId || it.getAttribute('data-project-id') || ''));

      if(carousel){
        if(newSlidesToShow !== state.slidesToShow){
          hideWrapperDuringUpdate();
          state.slidesToShow = newSlidesToShow;
          updateTrackInPlace(visible);
          revealWrapperAfterUpdate();
          return;
        }

        if(arraysEqual(visibleIds, carouselVisibleIds)){
          update();
          return;
        }

        updateTrackInPlace(visible);
        return;
      }

      state.slidesToShow = newSlidesToShow;
      hideWrapperDuringUpdate();
      enableCarousel();
      revealWrapperAfterUpdate();
    }

    function attachObserver(){
      if(mo) return;
      mo = new MutationObserver(() => {
        if(isUpdating) return;
        if(obsDebounce) clearTimeout(obsDebounce);
        obsDebounce = setTimeout(rebuild, OBS_DEBOUNCE_MS);
      });
      mo.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-hidden', 'style'] });
    }

    // RESIZE + matchMedia + visualViewport: garantir responsividade imediata
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if(resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newSlides = calcSlidesToShow();
        if(newSlides !== state.slidesToShow){
          rebuild();
        }
      }, RESIZE_DEBOUNCE_MS);
    });

    // matchMedia listeners para breakpoint crossing (mais confiável em alguns envs)
    try {
      const mq800 = window.matchMedia('(min-width: 800px)');
      const mq1200 = window.matchMedia('(min-width: 1200px)');
      const mqHandler = () => {
        const newSlides = calcSlidesToShow();
        if(newSlides !== state.slidesToShow){
          rebuild();
        }
      };
      if (mq800.addEventListener) {
        mq800.addEventListener('change', mqHandler);
        mq1200.addEventListener('change', mqHandler);
      } else { // fallback antigo
        mq800.addListener(mqHandler);
        mq1200.addListener(mqHandler);
      }
    } catch(e){ /* ignore */ }

    // visualViewport resize (mobile browsers, virtual keyboard, etc)
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize', () => {
        const newSlides = calcSlidesToShow();
        if(newSlides !== state.slidesToShow) rebuild();
      });
    }

    filterWrap.style.display = '';
    requestAnimationFrame(() => {
      state.slidesToShow = calcSlidesToShow();
      enableCarousel();
      attachObserver();
    });
  });
});
