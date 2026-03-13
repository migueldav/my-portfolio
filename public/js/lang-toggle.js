(function(){
'use strict';

const STORAGE_KEY = "preferred-lang";

function getSavedLang(){
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved === "pt" || saved === "en") return saved;
  }catch(e){}
  return null;
}

function saveLang(lang){
  try{
    localStorage.setItem(STORAGE_KEY, lang);
  }catch(e){}
}

function getPreferredLang(){

  const saved = getSavedLang();
  if(saved) return saved;

  try{
    const nav = navigator.languages || [navigator.language || navigator.userLanguage || 'en'];

    for(const l of nav){
      if(!l) continue;

      const code = l.trim().toLowerCase();

      if(code.startsWith('pt')) return 'pt';
      if(code.startsWith('en')) return 'en';
    }

  }catch(e){}

  return 'en';
}

function ensurePrefix(pathname){

  if(!pathname) return null;

  if(pathname === '/' || pathname === '' || pathname.match(/^\/(index\.html)?$/)) return null;

  if(pathname.startsWith('/pt')) return 'pt';
  if(pathname.startsWith('/en')) return 'en';

  return null;

}

function buildNewPathFor(lang){

  const p = window.location.pathname || '/';
  const q = window.location.search || '';
  const h = window.location.hash || '';

  const currentPrefix = ensurePrefix(p);

  if(currentPrefix){

    return p.replace(new RegExp('^/' + currentPrefix), '/' + lang) + q + h;

  }else{

    if(p === '/' || p === '' || p.match(/^\/(index\.html)?$/))
      return '/' + lang + q + h;

    return '/' + lang + p.replace(/^\//, '') + q + h;

  }

}

function exists(path, timeoutMs = 2000){

  try{

    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), timeoutMs);

    return fetch(path, {method:'HEAD', signal:controller.signal, cache:'no-store'})
      .then(r => { clearTimeout(id); return r && r.ok; })
      .catch(()=> false);

  }catch(e){

    return Promise.resolve(false);

  }

}

function findLangSpans(btn){

  if(!btn) return null;

  const spans = Array.from(btn.querySelectorAll('span'));

  const mapping = {};

  spans.forEach(s => {

    const t = (s.textContent || '').trim().toLowerCase();

    if(t === 'pt' || t === 'pt-br') mapping['pt'] = s;
    if(t === 'en' || t === 'en-us' || t === 'en-gb') mapping['en'] = s;

  });

  return {
    primarySpan: spans[0] || null,
    secondarySpan: spans[1] || null,
    map: mapping
  };

}

function clearActiveOnSpans(btn){

  if(!btn) return;

  const spans = btn.querySelectorAll('span');

  spans.forEach(s => s.classList.remove('active'));

}

function setButtonState(btn){

  if(!btn) return;

  const p = window.location.pathname || '/';

  const prefix = ensurePrefix(p);

  clearActiveOnSpans(btn);

  const found = findLangSpans(btn);

  if(!found) return;

  const map = found.map;

  if(prefix === 'pt'){

    if(map.pt) map.pt.classList.add('active');
    else if(found.primarySpan) found.primarySpan.classList.add('active');

    btn.setAttribute('data-current-lang','pt');
    btn.setAttribute('aria-label','Idioma: Português');

  }

  else if(prefix === 'en'){

    if(map.en) map.en.classList.add('active');
    else if(found.secondarySpan) found.secondarySpan.classList.add('active');

    btn.setAttribute('data-current-lang','en');
    btn.setAttribute('aria-label','Language: English');

  }

}

function init(){

  const btn = document.querySelector('[data-role="lang-toggle"]');

  const path = window.location.pathname || '/';

  const prefix = ensurePrefix(path);

  if(prefix === null){

    const preferred = getPreferredLang();

    const target = preferred === 'pt' ? '/pt' : '/en';

    exists(target).then(ok => {

      if(ok){

        const url = target + (window.location.search || '') + (window.location.hash || '');

        window.location.replace(url);

      }

    });

  }

  if(btn){

    setButtonState(btn);

    btn.addEventListener('click', (ev) => {

      ev.preventDefault();

      const p = window.location.pathname || '/';

      const cur = ensurePrefix(p);

      const next = cur === 'pt' ? 'en' : 'pt';

      saveLang(next);

      const href = buildNewPathFor(next);

      exists(href.split(/[?#]/)[0]).then(ok => {

        window.location.href = href;

      });

    });

  }

}

if(document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', init);
else
  init();

})();