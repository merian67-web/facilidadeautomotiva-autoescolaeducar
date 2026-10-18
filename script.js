/* =========================================================
   CFC EDUCAR — Interatividade do site
   Autor: Site institucional
   Padrão: Vanilla JS modular (IIFE), sem dependências
   ========================================================= */

(function () {
  'use strict';

  /* ---------------------------------------------------------
     UTILITÁRIOS
  --------------------------------------------------------- */
  const $  = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. MENU MOBILE
  --------------------------------------------------------- */
  function initMobileMenu() {
    const toggle = $('#menuToggle');
    const nav    = $('#nav');
    if (!toggle || !nav) return;

    const openMenu = () => {
      nav.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Fechar menu');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      document.body.style.overflow = '';
    };

    const isOpen = () => nav.classList.contains('is-open');

    toggle.addEventListener('click', () => (isOpen() ? closeMenu() : openMenu()));

    // Fecha ao clicar em qualquer link do menu
    $$('.nav__link', nav).forEach((link) =>
      link.addEventListener('click', closeMenu)
    );

    // Fecha ao pressionar ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) closeMenu();
    });

    // Fecha ao clicar fora do menu (overlay implícito)
    document.addEventListener('click', (e) => {
      if (!isOpen()) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      closeMenu();
    });

    // Fecha ao redimensionar para desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 820 && isOpen()) closeMenu();
    });
  }

  /* ---------------------------------------------------------
     2. HEADER COM SOMBRA AO ROLAR
  --------------------------------------------------------- */
  function initHeaderScroll() {
    const header = $('#header');
    if (!header) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          header.classList.toggle('is-scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // estado inicial
  }

  /* ---------------------------------------------------------
     3. SMOOTH SCROLL (fallback para navegadores antigos
        e respeitando prefers-reduced-motion)
  --------------------------------------------------------- */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const headerOffset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;

        window.scrollTo({
          top,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });

        // Atualiza a URL sem recarregar
        history.replaceState(null, '', targetId);
      });
    });
  }

  /* ---------------------------------------------------------
     4. SCROLL REVEAL (IntersectionObserver)
        Adiciona classe .is-visible nos elementos .reveal
        com stagger automático por container.
  --------------------------------------------------------- */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;

    // Sem suporte? Mostra tudo imediatamente
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------
     5. BOTÃO VOLTAR AO TOPO
  --------------------------------------------------------- */
  function initBackToTop() {
    const btn = $('#backTop');
    if (!btn) return;

    const onScroll = () => {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    };

    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     6. ANO DINÂMICO NO FOOTER
  --------------------------------------------------------- */
  function initYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------
     7. MÁSCARA DE TELEFONE (formato brasileiro)
        (61) 99999-9999  |  (61) 9999-9999
  --------------------------------------------------------- */
  function initPhoneMask() {
    const input = $('input[name="telefone"]');
    if (!input) return;

    const format = (raw) => {
      const digits = raw.replace(/\D/g, '').slice(0, 11);
      if (digits.length === 0) return '';
      if (digits.length <= 2) return `(${digits}`;
      if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      }
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    input.addEventListener('input', (e) => {
      const cursorAtEnd = input.selectionStart === input.value.length;
      input.value = format(e.target.value);
      if (cursorAtEnd) {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    // Impede caracteres inválidos (opcional, defensivo)
    input.addEventListener('keypress', (e) => {
      if (!/[\d()\-\s]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    });
  }

  /* ---------------------------------------------------------
     8. VALIDAÇÃO + ENVIO DO FORMULÁRIO
        Sem backend → usa mailto: + fallback WhatsApp
  --------------------------------------------------------- */
  function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;

    const emailDestino = 'contato@autoescolaeducar.com';
    const whatsappNum  = '5561999899280';

    // Cria / reaproveita a área de feedback
    let feedback = $('.form__feedback', form);
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'form__feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      form.appendChild(feedback);
    }

    const setFeedback = (msg, type = 'info') => {
      feedback.textContent = msg;
      feedback.dataset.type = type;
    };

    const clearFeedback = () => setFeedback('', 'info');

    const validators = {
      nome: (v) => v.trim().length >= 3 || 'Informe seu nome completo (mín. 3 letras).',
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Informe um e-mail válido.',
      telefone: (v) => v.replace(/\D/g, '').length >= 10 || 'Informe um telefone com DDD.',
      interesse: (v) => v !== '' || 'Selecione uma opção de interesse.',
    };

    const validateField = (field) => {
      const name = field.name;
      const rule = validators[name];
      if (!rule) return true;

      const result = rule(field.value);
      const valid = result === true;

      field.classList.toggle('is-invalid', !valid);
      field.setAttribute('aria-invalid', valid ? 'false' : 'true');

      // Mensagem inline abaixo do campo
      let errEl = field.parentElement.querySelector('.form__error');
      if (!valid) {
        if (!errEl) {
          errEl = document.createElement('small');
          errEl.className = 'form__error';
          field.parentElement.appendChild(errEl);
        }
        errEl.textContent = result;
      } else if (errEl) {
        errEl.remove();
      }

      return valid;
    };

    // Validação em tempo real (no blur, para não incomodar)
    $$('input, select, textarea', form).forEach((field) => {
      field.addEventListener('blur', () => {
        if (field.value.trim() !== '') validateField(field);
      });
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) validateField(field);
        clearFeedback();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const fields = ['nome', 'email', 'telefone', 'interesse']
        .map((n) => form.elements[n])
        .filter(Boolean);

      const allValid = fields.every(validateField);

      if (!allValid) {
        setFeedback('Por favor, corrija os campos destacados.', 'error');
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) {
          firstInvalid.focus({ preventScroll: false });
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const dados = {
        nome:      form.elements.nome.value.trim(),
        email:     form.elements.email.value.trim(),
        telefone:  form.elements.telefone.value.trim(),
        interesse: form.elements.interesse.value,
        mensagem:  (form.elements.mensagem?.value || '').trim(),
      };

      // --- Estratégia 1: mailto (abre cliente de e-mail) ---
      const assunto = encodeURIComponent(`[Site] Contato de ${dados.nome} — ${dados.interesse}`);
      const corpo = encodeURIComponent(
        `Nome: ${dados.nome}\n` +
        `E-mail: ${dados.email}\n` +
        `Telefone: ${dados.telefone}\n` +
        `Interesse: ${dados.interesse}\n\n` +
        `Mensagem:\n${dados.mensagem || '(sem mensagem)'}\n\n` +
        `— Enviado pelo site autoescolaeducar.com`
      );

      // --- Estratégia 2: WhatsApp (fallback / alternativa) ---
      const textoWhats = encodeURIComponent(
        `Olá, CFC Educar! Vim pelo site.\n\n` +
        `*Nome:* ${dados.nome}\n` +
        `*E-mail:* ${dados.email}\n` +
        `*Telefone:* ${dados.telefone}\n` +
        `*Interesse:* ${dados.interesse}\n` +
        (dados.mensagem ? `\n*Mensagem:* ${dados.mensagem}` : '')
      );

      // Decisão: abre o WhatsApp (mais usado no Brasil) e
      // oferece o mailto como alternativa via link
      const whatsUrl = `https://wa.me/${whatsappNum}?text=${textoWhats}`;
      const mailUrl  = `mailto:${emailDestino}?subject=${assunto}&body=${corpo}`;

      // Abre o WhatsApp em nova aba
      window.open(whatsUrl, '_blank', 'noopener');

      // Feedback visual + opção de e-mail
      feedback.innerHTML =
        '✅ Tudo certo! Abrimos o WhatsApp em nova aba. ' +
        'Se preferir, <a href="' + mailUrl + '">envie por e-mail</a>.';
      feedback.dataset.type = 'success';

      // Limpa o formulário após envio
      form.reset();
      $$('.form__error', form).forEach((el) => el.remove());
      $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
    });
  }

  /* ---------------------------------------------------------
     9. ACCORDION DA POLÍTICA DE PRIVACIDADE
        - Garante acessibilidade (aria-expanded sync)
        - Mantém apenas um aberto por vez (opcional)
  --------------------------------------------------------- */
  function initAccordion() {
    const items = $$('.accordion__item');
    if (!items.length) return;

    items.forEach((item) => {
      const summary = $('.accordion__summary', item);
      if (!summary) return;

      // Sincroniza aria-expanded com o estado <details>
      const syncAria = () => summary.setAttribute('aria-expanded', item.open ? 'true' : 'false');
      syncAria();
      item.addEventListener('toggle', syncAria);

      // (Opcional) Fecha os outros ao abrir um
      summary.addEventListener('click', (e) => {
        // Se está abrindo, fecha os demais
        if (!item.open) {
          items.forEach((other) => {
            if (other !== item && other.open) other.open = false;
          });
        }
      });
    });
  }

  /* ---------------------------------------------------------
     10. ANO EM LINKS "current year" (caso queira reutilizar)
        Já coberto pelo #year, mas mantido por extensibilidade
  --------------------------------------------------------- */
  // (nada extra aqui — #year já resolve)

  /* ---------------------------------------------------------
     BOOTSTRAP — inicializa tudo quando o DOM estiver pronto
  --------------------------------------------------------- */
  function init() {
    initMobileMenu();
    initHeaderScroll();
    initSmoothScroll();
    initReveal();
    initBackToTop();
    initYear();
    initPhoneMask();
    initContactForm();
    initAccordion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
