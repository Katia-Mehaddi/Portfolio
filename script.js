// fullpage jump navigation + swiper for horizontal projects + form handling
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const sections = Array.from(document.querySelectorAll('.section'));
  let current = 0;
  let isBusy = false; // debounce lock for jumps
  const JUMP_DELAY = 700; // ms, adjust if you want slower/faster lock

  // ensure we begin at top or hash
  const hash = window.location.hash;
  if (hash) {
    const idx = sections.findIndex(s => '#' + s.id === hash);
    if (idx >= 0) current = idx;
  }
  // jump to current (no smooth)
  function jumpToIndex(idx) {
    idx = Math.max(0, Math.min(sections.length - 1, idx));
    current = idx;
    const target = sections[current];
    if (!target) return;
    // instant jump (no smooth)
    target.scrollIntoView({ behavior: 'auto' });
    // update hash without scrolling
    history.replaceState(null, '', '#' + target.id);
  }

  // initial jump (on load)
  jumpToIndex(current);

  // helper to go next/prev
  function goNext() { if (current < sections.length - 1) jumpToIndex(current + 1); }
  function goPrev() { if (current > 0) jumpToIndex(current - 1); }

  // Decide if event target is inside the projects swiper area (to avoid hijacking wheel)
  function isInProjects(target) {
    return !!target.closest('#projets') || !!target.closest('.mySwiper') || !!target.closest('.project-card');
  }

  // WHEEL handling -> jump immediate
  window.addEventListener('wheel', (e) => {
    if (isBusy) return;
    // if pointer is over projects/swiper, do not trigger page jump (let Swiper handle)
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (isInProjects(el)) return;

    const delta = e.deltaY;
    if (delta > 20) { // scroll down
      if (current < sections.length - 1) {
        isBusy = true;
        goNext();
        setTimeout(() => isBusy = false, JUMP_DELAY);
      }
    } else if (delta < -20) { // scroll up
      if (current > 0) {
        isBusy = true;
        goPrev();
        setTimeout(() => isBusy = false, JUMP_DELAY);
      }
    }
  }, { passive: true });

  // KEYBOARD handling (Arrow keys & PageUp/PageDown/Home/End)
  window.addEventListener('keydown', (e) => {
    if (isBusy) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      isBusy = true;
      goNext();
      setTimeout(() => isBusy = false, JUMP_DELAY);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      isBusy = true;
      goPrev();
      setTimeout(() => isBusy = false, JUMP_DELAY);
    } else if (e.key === 'Home') {
      e.preventDefault();
      isBusy = true;
      jumpToIndex(0);
      setTimeout(() => isBusy = false, JUMP_DELAY);
    } else if (e.key === 'End') {
      e.preventDefault();
      isBusy = true;
      jumpToIndex(sections.length - 1);
      setTimeout(() => isBusy = false, JUMP_DELAY);
    }
  });

  // TOUCH / SWIPE support (vertical)
  (function enableTouchJump() {
    let startY = 0, endY = 0, touchActive = false;
    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length) {
        startY = e.touches[0].clientY;
        touchActive = true;
      }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (!touchActive) return;
      endY = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchend', () => {
      if (!touchActive || isBusy) { touchActive = false; return; }
      const diff = startY - endY;
      if (Math.abs(diff) > 60) {
        isBusy = true;
        if (diff > 0) goNext(); else goPrev();
        setTimeout(() => isBusy = false, JUMP_DELAY);
      }
      touchActive = false;
    }, { passive: true });
  })();

  // Navigation links (header / buttons) with data-goto attribute
  document.querySelectorAll('[data-goto]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const idx = sections.findIndex(s => '#' + s.id === href);
      if (idx >= 0) {
        jumpToIndex(idx);
      }
    });
  });

  // scroll next button
  const toNext = document.getElementById('toNext');
  if (toNext) {
    toNext.addEventListener('click', () => {
      if (current < sections.length - 1) {
        jumpToIndex(current + 1);
      }
    });
  }

  // update current index when user clicks or uses hash
  window.addEventListener('hashchange', () => {
    const idx = sections.findIndex(s => '#' + s.id === location.hash);
    if (idx >= 0) current = idx;
  });

  // --- SWIPER for horizontal projects ---
  const swiper = new Swiper('.mySwiper', {
    slidesPerView: 1.1,
    spaceBetween: 20,
    breakpoints: {
      700: { slidesPerView: 2.2 },
      1000: { slidesPerView: 3 }
    },
    // enable mousewheel control inside swiper, but do not affect page jump because we check isInProjects()
    mousewheel: { forceToAxis: true, invert: false, sensitivity: 1 },
    keyboard: { enabled: true },
  });

  // swiper nav
  const prevBtn = document.getElementById('projPrev');
  const nextBtn = document.getElementById('projNext');
  if (prevBtn) prevBtn.addEventListener('click', () => swiper.slidePrev());
  if (nextBtn) nextBtn.addEventListener('click', () => swiper.slideNext());

  // When user focuses inside projects (tab), avoid page jumps from wheel — managed via isInProjects() checks above.

  // FORM handling (AJAX) — works with Formspree endpoints and on GitHub Pages
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.action || form.action.includes('{YOUR_FORM_ID}')) {
        status.textContent = '⚠️ Remplace {YOUR_FORM_ID} par ton endpoint Formspree.';
        return;
      }
      const fd = new FormData(form);
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        });
        if (res.ok) {
          form.reset();
          status.textContent = '✅ Merci — message envoyé.';
        } else {
          const json = await res.json().catch(()=>null);
          status.textContent = json?.error || 'Erreur lors de l’envoi.';
        }
      } catch (err) {
        status.textContent = 'Erreur réseau — réessaye.';
      }
    });
  }

  // Resize handler: if window resized, re-jump to current to ensure correct layout
  window.addEventListener('resize', () => {
    jumpToIndex(current);
  });

  // Optional: if user manually scrolls (touchpad), update current index on scroll end
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const y = window.scrollY;
      let idx = 0;
      sections.forEach((s, i) => {
        if (y >= s.offsetTop - window.innerHeight / 2) idx = i;
      });
      if (idx !== current) current = idx;
    }, 150);
  });

}); // DOMContentLoaded
