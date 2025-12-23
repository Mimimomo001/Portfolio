// event-effect.js — full interaction logic with mobile change:
// On small screens the sidebar is hidden when closed (no blue bar).
// Hamburger is visible when closed; hidden and removed from tab order when open.

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebar-toggle");
  const overlay = document.getElementById("page-overlay");
  const imgStack = document.getElementById("imgStack");
  const turb = document.getElementById("turb");
  const profileBack = document.getElementById("profileBack");
  const fish = document.getElementById("fish");

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const mobileQuery = window.matchMedia('(max-width:920px)');

  function setBodyScroll(enabled) {
    try { document.body.style.overflow = enabled ? '' : 'hidden'; } catch (e) {}
  }

  // Accessibility: hide toggle from A11Y & tab order
  function hideToggleForA11y() {
    if (!toggle) return;
    toggle.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('data-prev-tabindex', toggle.getAttribute('tabindex') || '');
    toggle.setAttribute('tabindex', '-1');
    toggle.style.pointerEvents = 'none';
    // also add helper class (used in CSS)
    toggle.classList.add('hidden-when-open');
  }
  function restoreToggleA11y() {
    if (!toggle) return;
    toggle.removeAttribute('aria-hidden');
    const prev = toggle.getAttribute('data-prev-tabindex');
    if (prev === '') toggle.removeAttribute('tabindex');
    else if (prev !== null) toggle.setAttribute('tabindex', prev);
    toggle.removeAttribute('data-prev-tabindex');
    toggle.style.pointerEvents = '';
    toggle.classList.remove('hidden-when-open');
  }

  // Open/Close sidebar
  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    sidebar.classList.remove('collapsed');
    sidebar.setAttribute('aria-hidden', 'false');
    if (overlay) {
      overlay.style.display = 'block';
      overlay.setAttribute('aria-hidden', 'false');
      window.getComputedStyle(overlay).opacity;
      overlay.style.opacity = '1';
    }
    if (mobileQuery.matches || isTouch) setBodyScroll(false);
    // Hide hamburger (visually + a11y)
    hideToggleForA11y();
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    sidebar.classList.add('collapsed');
    sidebar.setAttribute('aria-hidden', 'true');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay) overlay.style.display = '';
        if (overlay) overlay.setAttribute('aria-hidden', 'true');
      }, 240);
    }
    setBodyScroll(true);
    restoreToggleA11y();
    // On mobile ensure the sidebar is translated off-screen (CSS handles it)
  }

  // Initialize: on mobile start closed (hidden)
  if (mobileQuery.matches) {
    // ensure collapsed class present so CSS puts it off-screen
    sidebar && sidebar.classList.add('collapsed');
    // ensure toggle is accessible
    restoreToggleA11y();
  } else {
    // desktop default: collapsed thin bar visible
    sidebar && sidebar.classList.add('collapsed');
    restoreToggleA11y();
  }

  // Toggle wiring
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (sidebar && sidebar.classList.contains('open')) closeSidebar();
      else openSidebar();
    }, { passive: true });
  }

  // Overlay closes sidebar
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      closeSidebar();
    }, { passive: true });
  }

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  // Close when clicking outside (mobile)
  document.addEventListener('click', (e) => {
    if (!sidebar) return;
    const isInside = sidebar.contains(e.target) || (toggle && toggle.contains(e.target)) || (overlay && overlay.contains(e.target));
    if (!isInside && sidebar.classList.contains('open') && mobileQuery.matches) closeSidebar();
  }, { passive: true });

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      if (sidebar && sidebar.contains(a) && mobileQuery.matches) closeSidebar();
      ev.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    }, { passive: true });
  });

  // Optional libs (ScrollReveal/VanillaTilt) — safe guards
  if (typeof ScrollReveal !== 'undefined') {
    try {
      const sr = ScrollReveal();
      sr.reveal(".center", { distance: "12px", duration: 560, easing: "ease-in-out", origin: "bottom", interval: 80, reset: false });
      sr.reveal(".repository-card", { distance: "8px", duration: 560, origin: "bottom", interval: 80, reset: false });
      sr.reveal(".about-img-container", { scale: 0.98, duration: 420 });
    } catch (e) {}
  }
  if (typeof VanillaTilt !== 'undefined') {
    try {
      document.querySelectorAll(".repository-card, .about-img-container").forEach(el => {
        VanillaTilt.init(el, { max: 6, speed: 300, glare: false, "max-glare": 0.03 });
      });
    } catch (e) {}
  }

  // Liquify: optimized & disabled on touch
  if (imgStack && turb && profileBack && !isTouch) {
    try { turb.setAttribute('numOctaves', '1'); } catch (e) {}
    try { turb.setAttribute('baseFrequency', '0 0'); } catch (e) {}

    let animating = false, targetFreq = 0, currentFreq = 0, rafId = null;

    function setTargetFromEvent(e) {
      const rect = imgStack.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const ev = (e.touches && e.touches[0]) ? e.touches[0] : e;
      const x = ev.clientX, y = ev.clientY;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const maxDist = Math.max(rect.width, rect.height) * 0.6;
      const norm = Math.max(0, 1 - (dist / maxDist));
      const minFreq = 0.002, maxFreq = 0.022;
      targetFreq = minFreq + (maxFreq - minFreq) * norm;
    }

    function step() {
      currentFreq += (targetFreq - currentFreq) * 0.18;
      const val = `${currentFreq.toFixed(4)} ${(currentFreq * 0.9).toFixed(4)}`;
      try { turb.setAttribute('baseFrequency', val); } catch (e) {}
      const filter = turb.parentNode;
      const disp = filter ? filter.querySelector('feDisplacementMap') : null;
      const scale = Math.round(6 + currentFreq * 180);
      if (disp) disp.setAttribute('scale', String(scale));
      rafId = requestAnimationFrame(step);
    }

    function start() { if (!animating) { animating = true; targetFreq = 0.01; currentFreq = 0; if (!rafId) step(); } }
    function stopAndReset() {
      targetFreq = 0;
      setTimeout(() => {
        cancelAnimationFrame(rafId);
        rafId = null;
        animating = false;
        try { turb.setAttribute('baseFrequency', '0 0'); } catch (e) {}
        const filter = turb.parentNode;
        const disp = filter ? filter.querySelector('feDisplacementMap') : null;
        if (disp) disp.setAttribute('scale', '0');
      }, 260);
    }

    imgStack.addEventListener('mouseenter', (e) => { if (!mobileQuery.matches) { start(); setTargetFromEvent(e); } }, { passive: true });
    imgStack.addEventListener('mousemove', (e) => { if (!mobileQuery.matches) setTargetFromEvent(e); }, { passive: true });
    imgStack.addEventListener('mouseleave', (e) => { stopAndReset(); }, { passive: true });
    imgStack.addEventListener('pointerenter', (e) => { if (!mobileQuery.matches && e.pointerType === 'mouse') { start(); setTargetFromEvent(e); } }, { passive: true });
    imgStack.addEventListener('pointermove', (e) => { if (!mobileQuery.matches && e.pointerType === 'mouse') setTargetFromEvent(e); }, { passive: true });
    imgStack.addEventListener('pointerleave', (e) => { stopAndReset(); }, { passive: true });
  } else if (profileBack) {
    profileBack.style.filter = 'none';
    if (turb) try { turb.setAttribute('baseFrequency', '0 0'); } catch (e) {}
  }

  // Fish cursor (disabled on touch & small screens)
  if (fish) {
    if (isTouch || mobileQuery.matches) {
      fish.style.display = 'none';
    } else {
      let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
      let fishX = mouseX, fishY = mouseY, lastX = mouseX, lastY = mouseY;
      let vx = 0, vy = 0; const ease = 0.14;

      function handleMove(e) {
        const ev = (e.touches && e.touches.length) ? e.touches[0] : e;
        mouseX = ev.clientX; mouseY = ev.clientY;
      }
      window.addEventListener('pointermove', handleMove, { passive: true });
      window.addEventListener('touchmove', handleMove, { passive: true });

      function animateFish() {
        fishX += (mouseX - fishX) * ease; fishY += (mouseY - fishY) * ease;
        vx = (fishX - lastX); vy = (fishY - lastY); lastX = fishX; lastY = fishY;
        const angle = Math.atan2(vy, vx) * (180 / Math.PI);
        const speed = Math.min(1.6, Math.hypot(vx, vy) * 0.08);
        const scale = 1 + speed * 0.14;
        fish.style.left = `${fishX}px`; fish.style.top = `${fishY}px`;
        fish.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${scale})`;
        requestAnimationFrame(animateFish);
      }
      requestAnimationFrame(animateFish);

      function pointerInteracts(e) {
        const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
        if (["A","BUTTON","INPUT","TEXTAREA","SELECT","LABEL"].includes(tag)) fish.style.opacity = '0.22';
        else fish.style.opacity = '1';
      }
      window.addEventListener('pointerdown', pointerInteracts);
      window.addEventListener('pointerup', pointerInteracts);
      window.addEventListener('pointerover', pointerInteracts);
      window.addEventListener('pointerout', pointerInteracts);

      if (mobileQuery.addEventListener) {
        mobileQuery.addEventListener('change', (e) => {
          if (e.matches) fish.style.display = 'none';
          else fish.style.display = '';
        });
      } else {
        window.addEventListener('resize', () => {
          if (window.innerWidth <= 920) fish.style.display = 'none';
          else fish.style.display = '';
        });
      }
    }
  }

  // React to breakpoint changes: when entering mobile, ensure sidebar closed (hidden)
  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', (e) => {
      if (e.matches) {
        // entering mobile
        closeSidebar();
      } else {
        // entering desktop: restore collapsed thin bar
        sidebar && sidebar.classList.add('collapsed');
        restoreToggleA11y();
        setBodyScroll(true);
      }
    });
  }
});
