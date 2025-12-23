// event-effect.js — Mobile-first, iOS-aware, optimized SVG liquify
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebar-toggle");
  const overlay = document.getElementById("page-overlay");

  // detect touch early
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const mobileQuery = window.matchMedia('(max-width:920px)');

  // helper to open/close sidebar
  function openSidebar() {
    sidebar.classList.add("open");
    sidebar.classList.remove("collapsed");
    sidebar.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    // prevent background scrolling on small devices
    if (mobileQuery.matches || isTouch) document.body.style.overflow = 'hidden';
    toggle.classList.add("move-right");
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebar.classList.add("collapsed");
    sidebar.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = '';
    toggle.classList.remove("move-right");
  }

  // Toggle sidebar
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    if (sidebar.classList.contains("open")) closeSidebar();
    else openSidebar();
  });

  // overlay closes sidebar
  overlay.addEventListener("click", closeSidebar);

  // Close sidebar when clicking outside on small screens
  document.addEventListener("click", (e) => {
    const isInside = sidebar.contains(e.target) || toggle.contains(e.target) || overlay.contains(e.target);
    if (!isInside && sidebar.classList.contains("open") && mobileQuery.matches) {
      closeSidebar();
    }
  });

  // Smooth scroll for sidebar links
  document.querySelectorAll('#sidebar a[href^="#"]').forEach(a => {
    a.addEventListener("click", (ev) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      ev.preventDefault();
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      closeSidebar();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    });
  });

  // ScrollReveal (if available)
  if (typeof ScrollReveal !== "undefined") {
    const sr = ScrollReveal();
    sr.reveal(".center", { distance: "12px", duration: 560, easing: "ease-in-out", origin: "bottom", interval: 80, reset: false });
    sr.reveal(".repository-card", { distance: "8px", duration: 560, origin: "bottom", interval: 80, reset: false });
    sr.reveal(".about-img-container", { scale: 0.98, duration: 420 });
  }

  // VanillaTilt (if available)
  if (typeof VanillaTilt !== "undefined") {
    document.querySelectorAll(".repository-card, .about-img-container").forEach(el => {
      VanillaTilt.init(el, { max: 6, speed: 300, glare: false, "max-glare": 0.03 });
    });
  }

  // -----------------------
  // Liquify behavior for profile image (optimized for mobile)
  // -----------------------
  const imgStack = document.getElementById("imgStack");
  const turb = document.getElementById("turb"); // feTurbulence element
  const profileBack = document.getElementById("profileBack");

  // Do not run liquify on touch devices (performance & UX)
  if (imgStack && turb && profileBack && !isTouch) {
    // reduce complexity for iOS Safari: lower numOctaves and smaller ranges
    try {
      // set a conservative default for desktop; mobile will skip entire block
      turb.setAttribute("numOctaves", "1");
      turb.setAttribute("baseFrequency", "0 0");
    } catch (err) { /* ignore if read-only */ }

    let animating = false;
    let targetFreq = 0;
    let currentFreq = 0;
    let rafId = null;

    function setTargetFromEvent(e) {
      const rect = imgStack.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = (e.clientX === undefined && e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
      const y = (e.clientY === undefined && e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
      const dx = (x - cx);
      const dy = (y - cy);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.max(rect.width, rect.height) * 0.6;
      const norm = Math.max(0, 1 - (dist / maxDist)); // 0..1
      const minFreq = 0.002;
      const maxFreq = 0.022; // slightly reduced cap
      targetFreq = minFreq + (maxFreq - minFreq) * norm;
    }

    function step() {
      currentFreq += (targetFreq - currentFreq) * 0.18;
      const val = `${currentFreq.toFixed(4)} ${ (currentFreq * 0.9).toFixed(4) }`;
      try { turb.setAttribute("baseFrequency", val); } catch(e){}
      const scale = Math.round(6 + currentFreq * 180);
      const filter = turb.parentNode;
      const disp = filter.querySelector("feDisplacementMap");
      if (disp) disp.setAttribute("scale", scale.toString());
      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (!animating) {
        animating = true;
        targetFreq = 0.01;
        currentFreq = 0;
        if (!rafId) step();
      }
    }

    imgStack.addEventListener("mouseenter", (e) => { if (!mobileQuery.matches) { start(); setTargetFromEvent(e); } }, { passive: true });
    imgStack.addEventListener("mousemove", (e) => { if (!mobileQuery.matches) setTargetFromEvent(e); }, { passive: true });
    imgStack.addEventListener("mouseleave", (e) => {
      targetFreq = 0;
      setTimeout(() => {
        cancelAnimationFrame(rafId);
        rafId = null;
        animating = false;
        try { turb.setAttribute("baseFrequency", "0 0"); } catch(e){}
        const filter = turb.parentNode;
        const disp = filter.querySelector("feDisplacementMap");
        if (disp) disp.setAttribute("scale", "0");
      }, 260);
    }, { passive: true });
  } else if (imgStack && profileBack) {
    // ensure filter is disabled for touch devices
    profileBack.style.filter = "none";
    if (turb) try { turb.setAttribute("baseFrequency","0 0"); } catch(e){}
  }

  // -----------------------
  // Fish follow cursor (disabled on touch and small screens)
  // -----------------------
  const fish = document.getElementById("fish");
  if (fish) {
    if (isTouch || mobileQuery.matches) {
      fish.style.display = "none";
    } else {
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let fishX = mouseX;
      let fishY = mouseY;
      let lastX = mouseX;
      let lastY = mouseY;
      let vx = 0, vy = 0;
      const ease = 0.14;

      function handleMove(e) {
        const ev = e.touches && e.touches.length ? e.touches[0] : e;
        mouseX = ev.clientX;
        mouseY = ev.clientY;
      }
      window.addEventListener("pointermove", handleMove, { passive: true });

      function animateFish() {
        fishX += (mouseX - fishX) * ease;
        fishY += (mouseY - fishY) * ease;
        vx = (fishX - lastX);
        vy = (fishY - lastY);
        lastX = fishX; lastY = fishY;
        const angle = Math.atan2(vy, vx) * (180 / Math.PI);
        const speed = Math.min(1.6, Math.hypot(vx, vy) * 0.08);
        const scale = 1 + speed * 0.14;
        fish.style.left = `${fishX}px`;
        fish.style.top = `${fishY}px`;
        fish.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${scale})`;
        requestAnimationFrame(animateFish);
      }
      requestAnimationFrame(animateFish);

      function pointerInteracts(e) {
        const tag = e.target.tagName;
        if (["A","BUTTON","INPUT","TEXTAREA","SELECT","LABEL"].includes(tag)) {
          fish.style.opacity = "0.22";
        } else {
          fish.style.opacity = "1";
        }
      }
      window.addEventListener("pointerdown", pointerInteracts);
      window.addEventListener("pointerup", pointerInteracts);
      window.addEventListener("pointerover", pointerInteracts);
      window.addEventListener("pointerout", pointerInteracts);

      window.addEventListener("resize", () => {
        mouseX = Math.min(window.innerWidth - 6, mouseX);
        mouseY = Math.min(window.innerHeight - 6, mouseY);
      }, { passive: true });
    }
  }

  // React to viewport crossing breakpoint
  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', (e) => {
      if (e.matches) {
        closeSidebar();
        if (fish) fish.style.display = 'none';
      } else {
        if (fish && !isTouch) fish.style.display = '';
      }
    });
  }
});
