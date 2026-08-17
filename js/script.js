/* ============================================================
   SCRIPT.JS — Dra. Patrícia Gouveia · Psicóloga
   ============================================================
   Contém:
   1. Scroll reveal (inalterado)
   2. Validação do formulário com highlight a vermelho
   3. Toast de erro para campos em falta
   4. Pop-up de sucesso inline (substitui o form após envio)
   5. dataLayer.push para GTM — trigger "form_consulta_success"
   ============================================================ */


/* ----------------------------------------------------------
   1. SCROLL REVEAL (inalterado)
   ---------------------------------------------------------- */
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 80);
  });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));


/* ----------------------------------------------------------
   2. TOAST DE ERRO
   Aparece no canto inferior direito, desaparece após 4s.
   Chamado com: showToast('Mensagem de erro')
   ---------------------------------------------------------- */

/** Injeta os estilos do toast e do pop-up de sucesso (uma vez) */
function injectFormStyles() {
  if (document.getElementById('form-feedback-styles')) return;

  const css = `
    /* -------------------------------------------------------
       TOAST DE ERRO
       ------------------------------------------------------- */
    #form-toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 9998;

      background: #fff;
      border: 1.5px solid #f5c6cb;
      border-left: 4px solid #dc3545;
      border-radius: 0.875rem;
      padding: 1rem 1.25rem;
      box-shadow: 0 12px 40px rgba(220,53,69,0.15);

      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      min-width: 280px;
      max-width: 360px;

      font-family: 'DM Sans', sans-serif;

      animation: toast-in 0.35s cubic-bezier(0.34,1.3,0.64,1) both;
    }
    #form-toast.toast-hiding {
      animation: toast-out 0.3s ease forwards;
    }
    @keyframes toast-in {
      from { opacity:0; transform: translateX(24px); }
      to   { opacity:1; transform: translateX(0); }
    }
    @keyframes toast-out {
      from { opacity:1; transform: translateX(0); }
      to   { opacity:0; transform: translateX(24px); }
    }
    .toast-icon  { font-size: 1.2rem; flex-shrink:0; margin-top:0.05rem; }
    .toast-title { font-size: 0.82rem; font-weight:500; color:#b91c1c; margin-bottom:0.2rem; }
    .toast-msg   { font-size: 0.8rem;  font-weight:300; color:#6b7280; line-height:1.5; }
    .toast-close {
      margin-left:auto; background:none; border:none; font-size:1.1rem;
      color:#9ca3af; cursor:pointer; padding:0; line-height:1; flex-shrink:0;
      transition: color 0.2s;
    }
    .toast-close:hover { color:#374151; }

    /* -------------------------------------------------------
       HIGHLIGHT DE CAMPOS COM ERRO
       Adicionar/remover classe .field-error no .form-group
       ------------------------------------------------------- */
    .form-group.field-error input,
    .form-group.field-error select,
    .form-group.field-error textarea {
      border-color: #dc3545 !important;
      background: #fff8f8 !important;
      animation: field-shake 0.35s ease;
    }
    .form-group.field-error label {
      color: #dc3545;
    }
    /* Mensagem de erro por campo */
    .field-error-msg {
      font-size: 0.72rem;
      color: #dc3545;
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    /* Pequeno shake ao marcar erro */
    @keyframes field-shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-4px); }
      60%      { transform: translateX(4px); }
    }

    /* -------------------------------------------------------
       POP-UP DE SUCESSO (inline, substitui o formulário)
       ------------------------------------------------------- */
    .form-success-popup {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 2rem;
      gap: 1rem;
      animation: popup-in 0.5s cubic-bezier(0.34,1.3,0.64,1) both;
    }
    @keyframes popup-in {
      from { opacity:0; transform: scale(0.92) translateY(12px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }
    .popup-check {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, #3a6591, #2a4f72);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem;
      box-shadow: 0 8px 24px rgba(58,101,145,0.25);
      animation: check-bounce 0.6s 0.15s cubic-bezier(0.34,1.5,0.64,1) both;
    }
    @keyframes check-bounce {
      from { opacity:0; transform: scale(0.5); }
      to   { opacity:1; transform: scale(1); }
    }
    .popup-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.6rem; font-weight:400; color:#252830; line-height:1.2;
    }
    .popup-title em { font-style:italic; color:#3a6591; }
    .popup-text {
      font-size: 0.9rem; color:#6b7280; line-height:1.7;
      font-weight:300; max-width:320px;
    }
    .popup-detail {
      font-size: 0.78rem; color:#9ca3af; font-weight:300;
    }

    /* Responsivo */
    @media (max-width: 500px) {
      #form-toast { right:1rem; bottom:1rem; left:1rem; max-width:none; }
    }
  `;

  const style = document.createElement('style');
  style.id = 'form-feedback-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

/* Mostra o toast com título e mensagem. Remove o anterior se existir. */
function showToast(title, message) {
  const existing = document.getElementById('form-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'form-toast';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-icon">⚠️</span>
    <div>
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" aria-label="Fechar">×</button>
  `;
  document.body.appendChild(toast);

  // Fechar manualmente
  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

  // Fechar automaticamente após 5 segundos
  setTimeout(() => dismissToast(toast), 5000);
}

function dismissToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.add('toast-hiding');
  setTimeout(() => toast.remove(), 300);
}


/* ----------------------------------------------------------
   3. VALIDAÇÃO DO FORMULÁRIO
   Campos obrigatórios: nome, email, servico
   Campo telefone: obrigatório mas apenas formato básico
   ---------------------------------------------------------- */

/**
 * Regras de validação.
 * Cada entrada: { id, label, required, validator? }
 * validator é uma função opcional que devolve string de erro ou null.
 */
const FIELD_RULES = [
  {
    id: 'nome',
    label: 'Nome',
    required: true,
    validator: (v) => v.length < 2 ? 'Introduza o seu nome completo.' : null,
  },
  {
    id: 'telefone',
    label: 'Telefone',
    required: true,
    validator: (v) => {
      // Aceita formatos PT: 9XXXXXXXX ou +351 9XX XXX XXX (com ou sem espaços)
      const digits = v.replace(/[\s\-\+]/g, '');
      return digits.length < 9 ? 'Introduza um número de telefone válido.' : null;
    },
  },
  {
    id: 'email',
    label: 'Email',
    required: true,
    validator: (v) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !re.test(v) ? 'Introduza um endereço de email válido.' : null;
    },
  },
  {
    id: 'servico',
    label: 'Tipo de consulta',
    required: true,
    validator: (v) => !v ? 'Por favor selecione o tipo de consulta.' : null,
  },
  // mensagem é opcional — remova o comentário abaixo para a tornar obrigatória
  // { id: 'mensagem', label: 'Mensagem', required: true },
];

/** Marca ou limpa o estado de erro de um campo */
function setFieldError(id, errorMsg) {
  const input = document.getElementById(id);
  if (!input) return;

  const group = input.closest('.form-group');
  if (!group) return;

  // Remove estado anterior
  group.classList.remove('field-error');
  const prev = group.querySelector('.field-error-msg');
  if (prev) prev.remove();

  if (errorMsg) {
    group.classList.add('field-error');
    const msg = document.createElement('div');
    msg.className = 'field-error-msg';
    msg.innerHTML = `<span>↑</span> ${errorMsg}`;
    group.appendChild(msg);
  }
}

/** Limpa todos os estados de erro */
function clearAllErrors() {
  FIELD_RULES.forEach(rule => setFieldError(rule.id, null));
}

/**
 * Valida todos os campos.
 * Devolve array de { id, label, error } para campos inválidos.
 */
function validateForm() {
  const errors = [];

  FIELD_RULES.forEach(rule => {
    const el = document.getElementById(rule.id);
    if (!el) return;

    const value = el.value.trim();

    // Campo obrigatório vazio
    if (rule.required && !value) {
      errors.push({ id: rule.id, label: rule.label, error: `${rule.label} é obrigatório.` });
      return;
    }

    // Validação adicional
    if (value && rule.validator) {
      const errMsg = rule.validator(value);
      if (errMsg) {
        errors.push({ id: rule.id, label: rule.label, error: errMsg });
      }
    }
  });

  return errors;
}

/** Remove o erro de um campo quando o utilizador começa a editá-lo */
function attachLiveValidation() {
  FIELD_RULES.forEach(rule => {
    const el = document.getElementById(rule.id);
    if (!el) return;

    const eventType = (el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(eventType, () => {
      const value = el.value.trim();
      // Só re-valida se o campo já estava marcado com erro
      const group = el.closest('.form-group');
      if (!group || !group.classList.contains('field-error')) return;

      if (!value) return; // ainda vazio, mantém erro
      const errMsg = rule.validator ? rule.validator(value) : null;
      setFieldError(rule.id, errMsg); // limpa se válido, mantém se ainda inválido
    });
  });
}


/* ----------------------------------------------------------
   4. POP-UP DE SUCESSO
   Substitui o conteúdo do formulário pelo thank you panel.
   ---------------------------------------------------------- */
function showSuccessPopup(formWrap) {
  // Guarda a altura atual para não colapsar o layout
  formWrap.style.minHeight = formWrap.offsetHeight + 'px';

  // Substitui o conteúdo
  formWrap.innerHTML = `
    <div class="form-success-popup">
      <div class="popup-check">✓</div>
      <h3 class="popup-title">Pedido enviado<br><em>com sucesso!</em></h3>
      <p class="popup-text">
        Obrigada pela sua mensagem. Entrarei em contacto em breve
        para confirmar a data e hora da consulta.
      </p>
      <p class="popup-detail">⏱ Tempo de resposta habitual: até 24h (dias úteis)</p>
    </div>
  `;
}


/* ----------------------------------------------------------
   5. ENVIO DO FORMULÁRIO COM GTM
   ---------------------------------------------------------- */
const RECAPTCHA_SITE_KEY = '6LdYQYstAAAAAE1WhCghbqqXYEgm3X8d0nPRADDw';

/** Obtém um token reCAPTCHA v3 para a ação 'submit'. */
function getRecaptchaToken() {
  return new Promise((resolve, reject) => {
    if (typeof grecaptcha === 'undefined') {
      reject(new Error('reCAPTCHA indisponível'));
      return;
    }
    grecaptcha.ready(() => {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' }).then(resolve, reject);
    });
  });
}

async function handleSubmit(e) {
  e.preventDefault();

  // Garante que os estilos estão injetados
  injectFormStyles();

  // Limpa erros anteriores
  clearAllErrors();

  // Recolhe valores
  const nome     = document.getElementById('nome').value.trim();
  const email    = document.getElementById('email').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const servico  = document.getElementById('servico').value;
  const mensagem = document.getElementById('mensagem').value.trim();
  const btn      = document.getElementById('submitBtn');

  /* --- Honeypot anti-spam ---
     Campo oculto que só bots preenchem. Se vier preenchido, finge
     sucesso sem enviar nada, para não dar pistas ao bot. */
  const gotcha = document.getElementById('_gotcha');
  if (gotcha && gotcha.value.trim() !== '') {
    const formWrap = btn.closest('.booking-form-wrap');
    if (formWrap) showSuccessPopup(formWrap);
    return;
  }

  /* --- Validação --- */
  const errors = validateForm();

  if (errors.length > 0) {
    // Marca cada campo com erro
    errors.forEach(({ id, error }) => setFieldError(id, error));

    // Foca o primeiro campo com erro
    document.getElementById(errors[0].id).focus();

    // Toast com resumo
    const errorList = errors.map(e => `• ${e.error}`).join('<br>');
    showToast(
      errors.length === 1 ? 'Falta preencher um campo' : `Faltam ${errors.length} campos`,
      errorList
    );

    return; // não submete
  }

  /* --- Envio --- */
  btn.textContent = 'A enviar...';
  btn.disabled = true;

  // Token reCAPTCHA v3 — se falhar (ex: bloqueador de anúncios), envia
  // na mesma e deixa o filtro de spam próprio do Formspree atuar.
  let recaptchaToken = '';
  try {
    recaptchaToken = await getRecaptchaToken();
  } catch (err) {
    recaptchaToken = '';
  }

  try {
    const res = await fetch('https://formspree.io/f/mdawjjoa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        nome, email, telefone, servico, mensagem,
        _subject: `${servico} — ${nome}`,
        'g-recaptcha-response': recaptchaToken,
      }),
    });

    if (res.ok) {
      /* -------------------------------------------------------
         GTM — evento de conversão
         No GTM: criar Trigger → Custom Event → form_consulta_success
         Usar como trigger para: GA4 Event, Google Ads, Meta Pixel, etc.
         ------------------------------------------------------- */
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event:          'form_consulta_success',  // nome do trigger no GTM
        form_servico:   servico,                  // dimensão personalizada: tipo de consulta
        form_origem:    window.location.pathname, // página onde o form foi submetido
      });

      /* Pop-up de sucesso — substitui o formulário */
      const formWrap = document.getElementById('submitBtn').closest('.booking-form-wrap');
      if (formWrap) {
        showSuccessPopup(formWrap);
      }

    } else {
      /* Erro do servidor */
      showToast(
        'Erro ao enviar',
        'Ocorreu um problema ao enviar o pedido. Por favor tente novamente ou contacte diretamente por telefone.'
      );
      btn.textContent = 'Enviar Pedido →';
      btn.disabled = false;
    }

  } catch (err) {
    /* Erro de rede */
    showToast(
      'Sem ligação',
      'Não foi possível ligar ao servidor. Verifique a sua ligação à internet e tente novamente.'
    );
    btn.textContent = 'Enviar Pedido →';
    btn.disabled = false;
  }
}


/* ----------------------------------------------------------
   BURGER MENU (mobile)
   ---------------------------------------------------------- */
function initBurgerMenu() {
  const burger  = document.querySelector('.nav-burger');
  const menu    = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu-overlay');
  const links   = document.querySelectorAll('.mobile-nav-link, .mobile-nav-cta');

  if (!burger || !menu) return;

  function openMenu() {
    menu.classList.add('is-open');
    overlay.classList.add('is-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    overlay.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    burger.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  links.forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}


/* ----------------------------------------------------------
   INICIALIZAÇÃO
   Liga a validação em tempo real assim que o DOM estiver pronto
   ---------------------------------------------------------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectFormStyles();
    attachLiveValidation();
    initBurgerMenu();
  });
} else {
  injectFormStyles();
  attachLiveValidation();
  initBurgerMenu();
}
