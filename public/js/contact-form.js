(function () {
  'use strict';

  const form = document.getElementById('contactForm');
  if (!form) return;

  const statusEl = document.getElementById('formStatus');
  const captchaA = document.getElementById('captchaA');
  const captchaB = document.getElementById('captchaB');
  const captchaInput = document.getElementById('captchaAnswer');
  const captchaFeedback = document.getElementById('captchaFeedback');

  function newCaptcha() {
    const a = Math.floor(Math.random() * 7) + 2;
    const b = Math.floor(Math.random() * 8) + 1;
    captchaA.textContent = a;
    captchaB.textContent = b;
    captchaInput.value = '';
    captchaInput.setAttribute('data-sum', String(a + b));
    captchaFeedback.textContent = '';
  }

  newCaptcha();

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    statusEl && (statusEl.textContent = '');

    const expected = parseInt(captchaInput.getAttribute('data-sum') || '0', 10);
    const given = parseInt(captchaInput.value || '', 10);

    if (Number.isNaN(given) || given !== expected) {
      captchaFeedback.textContent = 'Resposta incorreta da verificação. Tente novamente.';
      newCaptcha();
      return;
    }

    captchaFeedback.textContent = '';
    statusEl && (statusEl.textContent = 'Enviando...');

    const data = new FormData(form);
    data.append('captcha_valid', 'true');

    try {
      const res = await fetch(form.action, {
        method: form.method,
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        statusEl && (statusEl.textContent = 'Mensagem enviada! Obrigado — eu responderei em breve.');
        form.reset();
        newCaptcha();
      } else {
        const json = await res.json().catch(() => null);
        statusEl && (statusEl.textContent = json && json.error ? ('Erro: ' + json.error) : 'Erro ao enviar. Tente novamente.');
      }
    } catch (err) {
      statusEl && (statusEl.textContent = 'Não consegui enviar aqui — tentando envio padrão...');
      setTimeout(() => form.submit(), 700);
    }
  });

  captchaInput && captchaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // trigger validation & send
      const evt = new Event('submit', { cancelable: true });
      form.dispatchEvent(evt);
    }
  });
})();
