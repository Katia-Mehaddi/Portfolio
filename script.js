// script.js - optimized, accessible, full behavior
document.addEventListener('DOMContentLoaded', () => {
  /* -------------------------
     Utilities
  --------------------------*/
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  /* -------------------------
     Theme toggle (dark/light)
  --------------------------*/
  const themeToggle = $('#themeToggle');
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  themeToggle?.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  /* -------------------------
     Mobile menu
  --------------------------*/
  const mobileBtn = $('#mobileMenuBtn');
  const mobileMenu = $('#mobileMenu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      const open = mobileBtn.getAttribute('aria-expanded') === 'true';
      mobileBtn.setAttribute('aria-expanded', String(!open));
      if (open) mobileMenu.hidden = true;
      else mobileMenu.hidden = false;
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.hidden = true;
      mobileBtn.setAttribute('aria-expanded','false');
    }));
  }

  /* -------------------------
     Fullpage jump navigation
  --------------------------*/
  const sections = $$('.section');
  let current = 0;
  let isBusy = false;
  const JUMP_DELAY = 650;

  // map id -> index
  const idToIndex = {};
  sections.forEach((s, i) => idToIndex[s.id] = i);

  // initial from hash
  const hash = window.location.hash;
  if (hash && idToIndex[hash.replace('#','')] !== undefined) current = idToIndex[hash.replace('#','')];

  function jumpToIndex(idx, behavior='auto') {
    idx = Math.max(0, Math.min(sections.length - 1, idx));
    current = idx;
    const target = sections[current];
    if (!target) return;
    target.scrollIntoView({ behavior });
    history.replaceState(null, '', '#' + target.id);
  }
  jumpToIndex(current, 'auto');

  // helpers next/prev
  function goNext(){ if (current < sections.length - 1) jumpToIndex(current + 1, 'smooth'); }
  function goPrev(){ if (current > 0) jumpToIndex(current - 1, 'smooth'); }

  // wheel navigation (throttled)
  let wheelThrottle = false;
  window.addEventListener('wheel', (e) => {
    if (wheelThrottle) return;
    // ignore if pointer inside swiper
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.closest && el.closest('.projects-swiper')) return;
    const delta = e.deltaY;
    if (Math.abs(delta) < 20) return;
    wheelThrottle = true;
    if (delta > 0) goNext(); else goPrev();
    setTimeout(()=> wheelThrottle = false, JUMP_DELAY);
  }, { passive: true });

  // keyboard
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown','PageDown'].includes(e.key)) { e.preventDefault(); goNext(); }
    if (['ArrowUp','PageUp'].includes(e.key)) { e.preventDefault(); goPrev(); }
    if (e.key === 'Home') { e.preventDefault(); jumpToIndex(0,'smooth'); }
    if (e.key === 'End') { e.preventDefault(); jumpToIndex(sections.length-1,'smooth'); }
  });

  // touch vertical swipe
  (function(){
    let startY = 0, endY = 0, active = false;
    window.addEventListener('touchstart', e => { if (e.touches && e.touches.length) { startY = e.touches[0].clientY; active = true; } }, { passive:true });
    window.addEventListener('touchmove', e => { if (!active) return; endY = e.touches[0].clientY; }, { passive:true });
    window.addEventListener('touchend', () => {
      if (!active) return;
      const diff = startY - endY;
      if (Math.abs(diff) > 60) {
        if (diff > 0) goNext(); else goPrev();
      }
      active = false;
    }, { passive:true });
  })();

  // nav links
  $$('[data-goto]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const id = href.replace('#','');
      if (idToIndex[id] !== undefined) jumpToIndex(idToIndex[id],'smooth');
    });
  });

  $('#toNext')?.addEventListener('click', () => { if (current < sections.length-1) jumpToIndex(current+1,'smooth'); });

  window.addEventListener('resize', () => jumpToIndex(current, 'auto'));

  /* -------------------------
     Swiper initialization (coverflow)
  --------------------------*/
  // ensure Swiper lib is loaded
  function initSwiperWhenReady() {
    if (typeof Swiper === 'undefined') {
      setTimeout(initSwiperWhenReady, 100);
      return;
    }
    const projectsSwiper = new Swiper('.projects-swiper', {
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 'auto',
      spaceBetween: 48,
      loop: true,
      coverflowEffect: { rotate: 0, stretch: 60, depth: 220, modifier: 1, slideShadows: false },
      speed: 700,
      autoplay: { delay: 4500, disableOnInteraction: true },
      pagination: { el: '.projects-swiper .swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      keyboard: { enabled: true },
      mousewheel: { forceToAxis: true, invert: false, sensitivity: 0.8 },
      breakpoints: { 0: { spaceBetween: 20 }, 700: { spaceBetween: 36 }, 1100: { spaceBetween: 48 } },
      on: {
        init() {
          // scale active slide image for slight parallax
          this.slides.forEach(s => { const img = s.querySelector('.project-media'); if (img) img.style.transform = 'scale(1)'; });
          const active = this.slides[this.activeIndex]?.querySelector('.project-media');
          if (active) active.style.transform = 'scale(1.06)';
        },
        slideChangeTransitionStart() {
          this.slides.forEach(slide => { const img = slide.querySelector('.project-media'); if (img) img.style.transform = 'scale(1)'; });
          const active = this.slides[this.activeIndex]?.querySelector('.project-media');
          if (active) active.style.transform = 'scale(1.06)';
        }
      }
    });

    // prevent page jump while using mousewheel over swiper
    const swiperEl = document.querySelector('.projects-swiper');
    if (swiperEl) {
      swiperEl.addEventListener('mouseenter', ()=> { swiperEl.dataset.over = 'true'; });
      swiperEl.addEventListener('mouseleave', ()=> { swiperEl.dataset.over = 'false'; });
    }
  }
  initSwiperWhenReady();

  /* -------------------------
     Reveal on scroll - small animations
  --------------------------*/
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('inview');
      // optionally unobserve to keep it simple
      // observer.unobserve(e.target)
    });
  }, { root: null, rootMargin: '0px', threshold: 0.12 });

  // apply to sections and items with fade-up
  $$('.section').forEach(s => {
    s.classList.add('fade-up');
    observer.observe(s);
  });
  $$('.project-card, .skill, .teaser, .method-graphic .step').forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });

  /* -------------------------
     Demo toggles (skills)
  --------------------------*/
  $$('.tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const demoId = btn.getAttribute('data-demo');
      $$('.demo').forEach(d => d.classList.add('hidden'));
      document.getElementById(demoId)?.classList.remove('hidden');
    });
  });

  /* -------------------------
     Contact form AJAX (Formspree)
  --------------------------*/
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.action || form.action.includes('YOUR_FORM_ID')) {
        status.textContent = '⚠️ Remplace YOUR_FORM_ID par ton endpoint Formspree.';
        return;
      }
      const data = new FormData(form);
      try {
        const resp = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: data
        });
        if (resp.ok) {
          form.reset();
          status.textContent = '✅ Merci — message envoyé.';
        } else {
          const json = await resp.json().catch(()=>null);
          status.textContent = json?.error || 'Erreur lors de l’envoi.';
        }
      } catch (err) {
        status.textContent = 'Erreur réseau — réessaye.';
      }
    });
  }

  /* -------------------------
     Footer year
  --------------------------*/
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------------
     Accessibility: focus outline for keyboard
  --------------------------*/
  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      document.documentElement.classList.add('user-is-tabbing');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }
  window.addEventListener('keydown', handleFirstTab);
});
