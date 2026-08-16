/**
 * ============================================================
 * SHARE.JS — Partilha de Artigos em Redes Sociais
 * Dra. Patrícia Gouveia · Psicóloga
 * ============================================================
 *
 * COMO FUNCIONA:
 *  — Em mobile (Web Share API disponível): mostra um único botão
 *    "Partilhar" que abre o sheet nativo do sistema operativo.
 *    Inclui WhatsApp, Mensagens, Email, AirDrop, Instagram, etc.
 *  — Em desktop (sem Web Share API): mostra botões individuais
 *    para WhatsApp, Facebook, X, LinkedIn, Email e Copiar link.
 *
 * COMO USAR EM CADA ARTIGO:
 *  1. Adicione o bloco HTML do share onde quiser no artigo:
 *       <div class="artigo-share" id="share-block"></div>
 *
 *  2. Adicione o script antes do </body>:
 *       <script src="../../js/share.js"></script>
 *
 *  3. O script lê automaticamente o título e URL da página atual.
 *     Para personalizar a mensagem de partilha, adicione no HTML:
 *       <div ... data-share-text="Texto personalizado para partilha"></div>
 *
 * OPEN GRAPH / PREVIEW:
 *  O preview (thumbnail, título, descrição) é definido pelas meta
 *  tags OG no <head> de cada artigo — não por este script.
 *  Consulte os artigos para ver como estão configuradas.
 *
 * GTM:
 *  Cada partilha dispara: dataLayer.push({ event: 'artigo_partilhado', share_method: '...' })
 *  No GTM: Trigger → Custom Event → artigo_partilhado
 * ============================================================
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Aguarda o DOM estar pronto
     ---------------------------------------------------------- */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const block = document.getElementById('share-block');
    if (!block) return; // sem bloco na página, nada a fazer

    /* ----------------------------------------------------------
       Dados da partilha — lidos do bloco ou da página
       ---------------------------------------------------------- */
    const shareUrl   = window.location.href;
    const shareTitle = block.dataset.shareTitle  || document.title;
    const shareText  = block.dataset.shareText
      || document.querySelector('meta[name="description"]')?.content
      || shareTitle;

    /* ----------------------------------------------------------
       Verifica se Web Share API está disponível
       (iOS Safari, Android Chrome, alguns desktops modernos)
       ---------------------------------------------------------- */
    const hasNativeShare = !!(navigator.share);

    /* ----------------------------------------------------------
       Render do bloco
       ---------------------------------------------------------- */
    block.innerHTML = `
      <span class="artigo-share-label">Partilhar artigo</span>
      <div class="artigo-share-buttons" id="share-buttons"></div>
    `;

    const container = block.querySelector('#share-buttons');

    if (hasNativeShare) {
      /* --------------------------------------------------------
         MOBILE — botão único que abre o sheet nativo
         -------------------------------------------------------- */
      const btn = document.createElement('button');
      btn.className = 'share-btn share-btn-native';
      btn.setAttribute('aria-label', 'Partilhar este artigo');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
        </svg>
        Partilhar
      `;
      btn.addEventListener('click', function () {
        navigator.share({
          title: shareTitle,
          text:  shareText,
          url:   shareUrl,
        })
        .then(function () {
          pushGTM('native_share');
        })
        .catch(function (err) {
          /* Utilizador cancelou — não é um erro real */
          if (err.name !== 'AbortError') {
            console.warn('[Share] Erro na partilha nativa:', err);
          }
        });
      });
      container.appendChild(btn);

      /* Em mobile também mostramos o botão de copiar link */
      container.appendChild(makeCopyBtn(shareUrl));

    } else {
      /* --------------------------------------------------------
         DESKTOP — botões individuais por rede social
         -------------------------------------------------------- */
      const encoded = {
        url:   encodeURIComponent(shareUrl),
        title: encodeURIComponent(shareTitle),
        text:  encodeURIComponent(shareText),
      };

      const buttons = [
        {
          key:   'whatsapp',
          label: 'WhatsApp',
          cls:   'share-btn-whatsapp',
          href:  `https://wa.me/?text=${encoded.text}%20${encoded.url}`,
          icon:  `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
          target: '_blank',
        },
        {
          key:   'facebook',
          label: 'Facebook',
          cls:   'share-btn-facebook',
          href:  `https://www.facebook.com/sharer/sharer.php?u=${encoded.url}`,
          icon:  `<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
          target: '_blank',
        },
        {
          key:   'x',
          label: 'X',
          cls:   'share-btn-x',
          href:  `https://x.com/intent/tweet?text=${encoded.text}&url=${encoded.url}`,
          icon:  `<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
          target: '_blank',
        },
        {
          key:   'linkedin',
          label: 'LinkedIn',
          cls:   'share-btn-linkedin',
          href:  `https://www.linkedin.com/sharing/share-offsite/?url=${encoded.url}`,
          icon:  `<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
          target: '_blank',
        },
        {
          key:   'email',
          label: 'Email',
          cls:   'share-btn-email',
          href:  `mailto:?subject=${encoded.title}&body=${encoded.text}%0A%0A${encoded.url}`,
          icon:  `<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
          target: '_self',
        },
      ];

      buttons.forEach(function (def) {
        const a = document.createElement('a');
        a.className  = `share-btn ${def.cls}`;
        a.href       = def.href;
        a.target     = def.target;
        a.rel        = 'noopener noreferrer';
        a.setAttribute('aria-label', `Partilhar no ${def.label}`);
        a.innerHTML  = `${def.icon} ${def.label}`;
        a.addEventListener('click', function () {
          pushGTM(def.key);
        });
        container.appendChild(a);
      });

      /* Botão copiar link */
      container.appendChild(makeCopyBtn(shareUrl));
    }
  });


  /* ----------------------------------------------------------
     Botão "Copiar link" — partilhado entre mobile e desktop
     ---------------------------------------------------------- */
  function makeCopyBtn(url) {
    const btn = document.createElement('button');
    btn.className = 'share-btn share-btn-copy';
    btn.setAttribute('aria-label', 'Copiar link do artigo');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
      Copiar link
    `;

    btn.addEventListener('click', function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          showCopiedFeedback(btn);
          pushGTM('copy_link');
        });
      } else {
        /* Fallback para browsers sem Clipboard API */
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopiedFeedback(btn);
        pushGTM('copy_link');
      }
    });

    return btn;
  }

  /** Muda o botão para estado "copiado" e mostra toast central */
  function showCopiedFeedback(btn) {
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Copiado!
    `;

    /* Toast central no fundo do ecrã */
    const existing = document.querySelector('.share-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.textContent = '🔗 Link copiado para a área de transferência';
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('hiding');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2200);

    /* Restaura o botão após 3s */
    setTimeout(function () {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        Copiar link
      `;
    }, 3000);
  }


  /* ----------------------------------------------------------
     GTM — evento de partilha
     No GTM: Trigger → Custom Event → artigo_partilhado
     Dimensões disponíveis: share_method, share_url, share_title
     ---------------------------------------------------------- */
  function pushGTM(method) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event:        'artigo_partilhado',   /* nome do trigger no GTM */
      share_method: method,                /* 'whatsapp','facebook','x','linkedin','email','copy_link','native_share' */
      share_url:    window.location.href,
      share_title:  document.title,
    });
  }

})();
