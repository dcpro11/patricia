/**
 * ============================================================
 * COOKIES.JS — Sistema de Consentimento RGPD
 * Dra. Patrícia Gouveia · Psicóloga
 * ============================================================
 *
 * O QUE FAZ:
 *  1. Mostra um banner de cookies na primeira visita
 *  2. Modal de preferências granulares (essencial / analítico)
 *  3. Bloqueia Google Analytics e outras tags até consentimento
 *  4. Implementa Google Consent Mode v2 (para GTM)
 *  5. Guarda preferências em localStorage por 12 meses
 *  6. Expõe window.CookieConsent.show() para botões "gerir"
 *
 * CONFIGURAÇÃO:
 *  — Substitua GTM_ID pelo seu ID real do Google Tag Manager (ex: GTM-XXXXXX)
 *  — Substitua GA_ID pelo seu ID do Google Analytics 4 (ex: G-XXXXXXXXXX)
 *  — Se não usar GTM, comente a secção "Injetar GTM" e descomente "Injetar GA direto"
 *
 * INTEGRAÇÃO NO HTML:
 *  1. Adicione <script src="js/cookies.js"></script> no <head> ou antes do </body>
 *  2. NÃO coloque o snippet do GTM/GA no HTML — este script faz isso dinamicamente
 *  3. Adicione os links no footer:
 *     <a href="politica-de-privacidade.html">Privacidade</a>
 *     <a href="politica-de-cookies.html">Cookies</a>
 *
 * ============================================================
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONFIGURAÇÃO — edite apenas esta secção
     ---------------------------------------------------------- */
  const CONFIG = {
    GTM_ID:           'GTM-XXXXXX',    // ← substitua pelo seu GTM ID
    GA_ID:            'G-XXXXXXXXXX',  // ← substitua pelo seu GA4 ID (se usar GA direto sem GTM)
    USE_GTM:          true,            // true = usa GTM; false = injeta GA diretamente
    CONSENT_KEY:      'cookie_consent',
    VERSION_KEY:      'cookie_consent_version',
    CURRENT_VERSION:  '1.0',          // incremente se alterar categorias de cookies
    EXPIRY_DAYS:      365,
  };

  /* ----------------------------------------------------------
     CATEGORIAS DE COOKIES
     Adicione/remova categorias conforme necessário
     ---------------------------------------------------------- */
  const CATEGORIES = {
    essential:  { label: 'Essenciais',      required: true,  default: true },
    analytics:  { label: 'Analíticos',      required: false, default: false },
    // marketing: { label: 'Marketing',      required: false, default: false }, // descomente se usar
  };

  /* ----------------------------------------------------------
     ESTADO INTERNO
     ---------------------------------------------------------- */
  let currentPrefs = null; // preferências ativas
  let bannerEl     = null;
  let modalEl      = null;

  /* ----------------------------------------------------------
     UTILITÁRIOS
     ---------------------------------------------------------- */

  /** Lê as preferências guardadas em localStorage */
  function loadPrefs() {
    try {
      const raw     = localStorage.getItem(CONFIG.CONSENT_KEY);
      const version = localStorage.getItem(CONFIG.VERSION_KEY);
      if (!raw || version !== CONFIG.CURRENT_VERSION) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /** Guarda as preferências em localStorage */
  function savePrefs(prefs) {
    try {
      localStorage.setItem(CONFIG.CONSENT_KEY, JSON.stringify(prefs));
      localStorage.setItem(CONFIG.VERSION_KEY, CONFIG.CURRENT_VERSION);
    } catch (e) {
      // localStorage pode estar desativado (modo privado em alguns browsers)
      console.warn('[CookieConsent] Não foi possível guardar preferências:', e);
    }
  }

  /** Cria as preferências padrão (apenas essenciais) */
  function defaultPrefs() {
    const prefs = {};
    for (const key in CATEGORIES) {
      prefs[key] = CATEGORIES[key].default;
    }
    return prefs;
  }

  /* ----------------------------------------------------------
     GOOGLE CONSENT MODE v2
     Define o estado de consentimento para o GTM/GA interpretarem.
     Deve ser chamado ANTES de qualquer tag do GTM/GA ser carregada.
     ---------------------------------------------------------- */
  function initConsentMode(prefs) {
    // Inicializa a dataLayer se não existir
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    gtag('consent', 'default', {
      'ad_storage':              'denied',   // sempre negado — não usamos publicidade
      'ad_user_data':            'denied',
      'ad_personalization':      'denied',
      'analytics_storage':       prefs && prefs.analytics ? 'granted' : 'denied',
      'functionality_storage':   'granted',  // necessário para o site funcionar
      'personalization_storage': 'denied',
      'security_storage':        'granted',  // cookies de segurança essenciais
      'wait_for_update':         500,        // ms de espera para atualizar antes do primeiro evento
    });

    gtag('set', 'ads_data_redaction', true);
    gtag('set', 'url_passthrough', false);
  }

  /** Atualiza o consentimento após escolha do utilizador */
  function updateConsentMode(prefs) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    gtag('consent', 'update', {
      'analytics_storage': prefs.analytics ? 'granted' : 'denied',
    });
  }

  /* ----------------------------------------------------------
     INJEÇÃO DO GTM / GA
     Só injetado uma vez, após o consentimento inicial
     ---------------------------------------------------------- */
  let scriptInjected = false;

  function injectTracking() {
    if (scriptInjected) return;
    scriptInjected = true;

    if (CONFIG.USE_GTM) {
      /* --- Injeta Google Tag Manager --- */
      // O GTM em si não rastreia nada — o Consent Mode v2 controla o que as tags fazem
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        const f = d.getElementsByTagName(s)[0];
        const j = d.createElement(s);
        const dl = l !== 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);

        // Noscript fallback
        const noscript = d.createElement('noscript');
        const iframe = d.createElement('iframe');
        iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + i;
        iframe.height = '0';
        iframe.width = '0';
        iframe.style.display = 'none';
        iframe.style.visibility = 'hidden';
        noscript.appendChild(iframe);
        d.body.insertBefore(noscript, d.body.firstChild);
      })(window, document, 'script', 'dataLayer', CONFIG.GTM_ID);

    } else {
      /* --- Injeta Google Analytics 4 diretamente (sem GTM) --- */
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA_ID;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', CONFIG.GA_ID, { anonymize_ip: true });
    }
  }

  /* ----------------------------------------------------------
     CSS DO BANNER E MODAL
     Injetado dinamicamente para não exigir ficheiro CSS extra
     ---------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById('cookie-consent-styles')) return;

    const css = `
      /* =====================================================
         BANNER DE COOKIES
         ===================================================== */
      #cookie-banner {
        position: fixed;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        width: min(660px, calc(100vw - 2rem));

        background: #fff;
        border: 1px solid #dde5ef;
        border-radius: 1.25rem;
        box-shadow: 0 20px 60px rgba(37,40,48,0.15), 0 4px 16px rgba(37,40,48,0.08);

        padding: 1.75rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;

        font-family: 'DM Sans', sans-serif;

        animation: cb-slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }

      #cookie-banner.cb-hiding {
        animation: cb-slide-down 0.3s ease forwards;
      }

      @keyframes cb-slide-up {
        from { opacity:0; transform: translateX(-50%) translateY(24px); }
        to   { opacity:1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes cb-slide-down {
        from { opacity:1; transform: translateX(-50%) translateY(0); }
        to   { opacity:0; transform: translateX(-50%) translateY(24px); }
      }

      .cb-header {
        display: flex;
        align-items: flex-start;
        gap: 0.875rem;
      }
      .cb-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        margin-top: 0.1rem;
      }
      .cb-title {
        font-size: 0.95rem;
        font-weight: 500;
        color: #252830;
        margin-bottom: 0.3rem;
      }
      .cb-text {
        font-size: 0.82rem;
        color: #6b7280;
        line-height: 1.6;
        font-weight: 300;
      }
      .cb-text a {
        color: #3a6591;
        text-decoration: underline;
      }

      .cb-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        align-items: center;
      }

      /* Botão principal — Aceitar tudo */
      .cb-btn-accept {
        background: #3a6591;
        color: #fff;
        border: 2px solid #3a6591;
        border-radius: 3rem;
        padding: 0.6rem 1.4rem;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.82rem;
        font-weight: 500;
        letter-spacing: 0.04em;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        white-space: nowrap;
      }
      .cb-btn-accept:hover { background: #c9a84c; border-color: #c9a84c; color: #fff; }

      /* Botão secundário — Recusar não essenciais */
      .cb-btn-reject {
        background: transparent;
        color: #6b7280;
        border: 2px solid #dde5ef;
        border-radius: 3rem;
        padding: 0.6rem 1.2rem;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.82rem;
        font-weight: 400;
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
        white-space: nowrap;
      }
      .cb-btn-reject:hover { border-color: #3a6591; color: #3a6591; }

      /* Link — Gerir preferências */
      .cb-btn-manage {
        background: none;
        border: none;
        color: #3a6591;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.8rem;
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
        margin-left: auto;
      }
      .cb-btn-manage:hover { color: #c9a84c; }

      /* =====================================================
         MODAL DE PREFERÊNCIAS
         ===================================================== */
      #cookie-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(37,40,48,0.5);
        backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        animation: cb-fade-in 0.25s ease both;
      }
      #cookie-modal-overlay.cb-hiding {
        animation: cb-fade-out 0.2s ease forwards;
      }

      @keyframes cb-fade-in  { from { opacity:0; } to { opacity:1; } }
      @keyframes cb-fade-out { from { opacity:1; } to { opacity:0; } }

      #cookie-modal {
        background: #fff;
        border-radius: 1.25rem;
        width: min(540px, 100%);
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 30px 80px rgba(37,40,48,0.2);
        font-family: 'DM Sans', sans-serif;
        animation: cb-modal-in 0.3s cubic-bezier(0.34,1.2,0.64,1) both;
      }

      @keyframes cb-modal-in {
        from { opacity:0; transform: scale(0.95) translateY(8px); }
        to   { opacity:1; transform: scale(1) translateY(0); }
      }

      .cm-header {
        padding: 1.75rem 2rem 0;
        border-bottom: 1px solid #dde5ef;
        padding-bottom: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .cm-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.4rem;
        font-weight: 400;
        color: #252830;
      }
      .cm-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6b7280;
        cursor: pointer;
        line-height: 1;
        padding: 0.2rem;
        transition: color 0.2s;
        flex-shrink: 0;
      }
      .cm-close:hover { color: #252830; }

      .cm-body { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1rem; }

      /* Card de categoria */
      .cm-category {
        border: 1.5px solid #dde5ef;
        border-radius: 1rem;
        padding: 1.25rem 1.5rem;
        transition: border-color 0.2s;
      }
      .cm-category:has(.cm-toggle:checked) { border-color: #3a6591; }

      .cm-category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }
      .cm-category-name {
        font-size: 0.9rem;
        font-weight: 500;
        color: #252830;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .cm-required-badge {
        font-size: 0.65rem;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        background: #d1fae5;
        color: #065f46;
        padding: 0.15rem 0.5rem;
        border-radius: 2rem;
      }
      .cm-category-desc {
        font-size: 0.82rem;
        color: #6b7280;
        line-height: 1.6;
        font-weight: 300;
      }

      /* Toggle switch */
      .cm-toggle-wrap {
        position: relative;
        flex-shrink: 0;
      }
      .cm-toggle {
        appearance: none;
        width: 44px;
        height: 24px;
        background: #dde5ef;
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.25s;
        position: relative;
        display: block;
      }
      .cm-toggle::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        transition: left 0.25s;
      }
      .cm-toggle:checked { background: #3a6591; }
      .cm-toggle:checked::after { left: 23px; }
      .cm-toggle:disabled { opacity: 0.5; cursor: not-allowed; }

      /* Footer do modal */
      .cm-footer {
        padding: 1.25rem 2rem 1.75rem;
        border-top: 1px solid #dde5ef;
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .cm-btn-save {
        background: #3a6591;
        color: #fff;
        border: 2px solid #3a6591;
        border-radius: 3rem;
        padding: 0.65rem 1.5rem;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
        flex: 1;
      }
      .cm-btn-save:hover { background: #c9a84c; border-color: #c9a84c; }

      .cm-btn-accept-all {
        background: transparent;
        color: #3a6591;
        border: 2px solid #3a6591;
        border-radius: 3rem;
        padding: 0.65rem 1.5rem;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        flex: 1;
      }
      .cm-btn-accept-all:hover { background: #3a6591; color: #fff; }

      /* Responsivo */
      @media (max-width: 600px) {
        #cookie-banner { padding: 1.5rem; }
        .cb-actions { flex-direction: column; align-items: stretch; }
        .cb-btn-manage { margin-left: 0; text-align: center; }
        .cm-header, .cm-body, .cm-footer { padding-left: 1.25rem; padding-right: 1.25rem; }
        .cm-footer { flex-direction: column; }
      }
    `;

    const style = document.createElement('style');
    style.id = 'cookie-consent-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     BANNER HTML
     ---------------------------------------------------------- */
  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML = `
      <div class="cb-header">
        <span class="cb-icon">🍪</span>
        <div>
          <div class="cb-title">Este website utiliza cookies</div>
          <div class="cb-text">
            Utilizamos cookies essenciais para o funcionamento do site e, com o seu consentimento,
            cookies analíticos (Google Analytics) para melhorar a experiência.
            Consulte a nossa <a href="politica-de-cookies.html">Política de Cookies</a>
            e <a href="politica-de-privacidade.html">Política de Privacidade</a>.
          </div>
        </div>
      </div>
      <div class="cb-actions">
        <button class="cb-btn-accept" id="cb-accept-all">Aceitar todos</button>
        <button class="cb-btn-reject" id="cb-reject-all">Apenas essenciais</button>
        <button class="cb-btn-manage" id="cb-manage">Gerir preferências</button>
      </div>
    `;
    return banner;
  }

  /* ----------------------------------------------------------
     MODAL DE PREFERÊNCIAS HTML
     ---------------------------------------------------------- */
  function createModal(prefs) {
    const overlay = document.createElement('div');
    overlay.id = 'cookie-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Preferências de cookies');

    // Descrições de cada categoria
    const descriptions = {
      essential: 'Necessários para o funcionamento básico do website (aviso de cookies, sessão). Não podem ser desativados.',
      analytics: 'Permitem-nos analisar o tráfego do website através do Google Analytics. Os dados são anonimizados e usados para melhorar o conteúdo.',
      // marketing: 'Utilizados para mostrar anúncios relevantes. Não usamos publicidade neste website.',
    };

    const categoriesHTML = Object.entries(CATEGORIES).map(([key, cat]) => `
      <div class="cm-category">
        <div class="cm-category-header">
          <div class="cm-category-name">
            ${cat.label}
            ${cat.required ? '<span class="cm-required-badge">Sempre ativo</span>' : ''}
          </div>
          <div class="cm-toggle-wrap">
            <input
              type="checkbox"
              class="cm-toggle"
              id="toggle-${key}"
              data-category="${key}"
              ${cat.required ? 'checked disabled' : (prefs && prefs[key] ? 'checked' : '')}
            />
          </div>
        </div>
        <div class="cm-category-desc">${descriptions[key] || ''}</div>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div id="cookie-modal">
        <div class="cm-header">
          <span class="cm-title">Preferências de Cookies</span>
          <button class="cm-close" id="cm-close" aria-label="Fechar">×</button>
        </div>
        <div class="cm-body">
          ${categoriesHTML}
        </div>
        <div class="cm-footer">
          <button class="cm-btn-save" id="cm-save">Guardar preferências</button>
          <button class="cm-btn-accept-all" id="cm-accept-all">Aceitar todos</button>
        </div>
      </div>
    `;

    return overlay;
  }

  /* ----------------------------------------------------------
     LÓGICA DE MOSTRAR / ESCONDER
     ---------------------------------------------------------- */

  function hideBanner(callback) {
    if (!bannerEl) { if (callback) callback(); return; }
    bannerEl.classList.add('cb-hiding');
    setTimeout(() => {
      bannerEl.remove();
      bannerEl = null;
      if (callback) callback();
    }, 300);
  }

  function hideModal(callback) {
    if (!modalEl) { if (callback) callback(); return; }
    modalEl.classList.add('cb-hiding');
    setTimeout(() => {
      modalEl.remove();
      modalEl = null;
      if (callback) callback();
    }, 250);
  }

  function showModal() {
    if (modalEl) return;
    modalEl = createModal(currentPrefs);
    document.body.appendChild(modalEl);

    // Fechar ao clicar fora do modal
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) hideModal();
    });

    // Botão fechar
    modalEl.querySelector('#cm-close').addEventListener('click', () => hideModal());

    // Guardar preferências
    modalEl.querySelector('#cm-save').addEventListener('click', () => {
      const prefs = buildPrefsFromModal();
      applyAndSave(prefs);
      hideModal(() => hideBanner());
    });

    // Aceitar todos (dentro do modal)
    modalEl.querySelector('#cm-accept-all').addEventListener('click', () => {
      const prefs = acceptAllPrefs();
      applyAndSave(prefs);
      hideModal(() => hideBanner());
    });

    // Foco no modal para acessibilidade
    modalEl.querySelector('#cm-close').focus();
  }

  /** Lê os toggles do modal e devolve o objeto de preferências */
  function buildPrefsFromModal() {
    const prefs = {};
    const toggles = modalEl.querySelectorAll('.cm-toggle');
    toggles.forEach(toggle => {
      prefs[toggle.dataset.category] = toggle.checked;
    });
    return prefs;
  }

  function acceptAllPrefs() {
    const prefs = {};
    for (const key in CATEGORIES) prefs[key] = true;
    return prefs;
  }

  function rejectAllPrefs() {
    const prefs = {};
    for (const key in CATEGORIES) prefs[key] = CATEGORIES[key].required;
    return prefs;
  }

  /** Aplica consentimento, guarda e injeta tracking se necessário */
  function applyAndSave(prefs) {
    currentPrefs = prefs;
    savePrefs(prefs);
    updateConsentMode(prefs);
    // Injeta GTM/GA se analytics for aceite e ainda não estiver injetado
    if (prefs.analytics) injectTracking();
  }

  /* ----------------------------------------------------------
     INICIALIZAÇÃO PRINCIPAL
     ---------------------------------------------------------- */
  function init() {
    injectStyles();

    // Lê preferências guardadas
    const saved = loadPrefs();

    if (saved) {
      // Utilizador já escolheu — aplica consentimento silenciosamente
      currentPrefs = saved;
      initConsentMode(saved);
      if (saved.analytics) injectTracking();
      return; // não mostra banner
    }

    // Primeira visita — define consentimento negado por defeito (RGPD: opt-in)
    initConsentMode(null);

    // Mostra banner após DOM estar pronto
    function showBanner() {
      bannerEl = createBanner();
      document.body.appendChild(bannerEl);

      // Aceitar todos
      bannerEl.querySelector('#cb-accept-all').addEventListener('click', () => {
        const prefs = acceptAllPrefs();
        applyAndSave(prefs);
        hideBanner();
      });

      // Apenas essenciais
      bannerEl.querySelector('#cb-reject-all').addEventListener('click', () => {
        const prefs = rejectAllPrefs();
        applyAndSave(prefs);
        hideBanner();
      });

      // Gerir preferências
      bannerEl.querySelector('#cb-manage').addEventListener('click', () => {
        showModal();
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      // Pequeno delay para não bloquear o render inicial
      setTimeout(showBanner, 200);
    }
  }

  /* ----------------------------------------------------------
     API PÚBLICA — window.CookieConsent
     Permite abrir o modal a partir de qualquer página
     (usado nos botões "Gerir Preferências de Cookies" das políticas)
     ---------------------------------------------------------- */
  window.CookieConsent = {
    /** Abre o modal de preferências */
    show: function () {
      injectStyles();
      currentPrefs = loadPrefs() || defaultPrefs();
      showModal();
    },
    /** Devolve as preferências atuais */
    getPrefs: function () {
      return currentPrefs || loadPrefs() || defaultPrefs();
    },
    /** Verifica se uma categoria está ativa */
    hasConsent: function (category) {
      const prefs = currentPrefs || loadPrefs();
      return prefs ? !!prefs[category] : false;
    },
    /** Reseta tudo (útil para testes em desenvolvimento) */
    reset: function () {
      localStorage.removeItem(CONFIG.CONSENT_KEY);
      localStorage.removeItem(CONFIG.VERSION_KEY);
      location.reload();
    },
  };

  /* ----------------------------------------------------------
     ARRANQUE
     ---------------------------------------------------------- */
  init();

})();
