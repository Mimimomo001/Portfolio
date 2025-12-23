// event-effect.js
// Handles sidebar toggle, smooth scrolling, ScrollReveal, VanillaTilt,
// profile-image liquify interaction, and a small white fish that follows the cursor.

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebar-toggle");

  // Toggle sidebar open/close
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    const wasOpen = sidebar.classList.contains("open");
    if (wasOpen) {
      sidebar.classList.remove("open");
      sidebar.classList.add("collapsed");
      sidebar.setAttribute("aria-hidden", "true");
      toggle.classList.remove("move-right");
    } else {
      sidebar.classList.remove("collapsed");
      sidebar.classList.add("open");
      sidebar.setAttribute("aria-hidden", "false");
      toggle.classList.add("move-right");
    }
  });

  // Close sidebar when clicking outside on small screens
  document.addEventListener("click", (e) => {
    const isInside = sidebar.contains(e.target) || toggle.contains(e.target);
    if (!isInside && sidebar.classList.contains("open") && window.innerWidth < 900) {
      sidebar.classList.remove("open");
      sidebar.classList.add("collapsed");
      sidebar.setAttribute("aria-hidden", "true");
      toggle.classList.remove("move-right");
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
      if (window.innerWidth < 900) {
        sidebar.classList.remove("open");
        sidebar.classList.add("collapsed");
        sidebar.setAttribute("aria-hidden", "true");
        toggle.classList.remove("move-right");
      }
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    });
  });

  // ScrollReveal
  if (typeof ScrollReveal !== "undefined") {
    const sr = ScrollReveal();
    sr.reveal(".center", { distance: "14px", duration: 650, easing: "ease-in-out", origin: "bottom", interval: 80, reset: false });
    sr.reveal(".repository-card", { distance: "10px", duration: 650, origin: "bottom", interval: 80, reset: false });
    sr.reveal(".about-img-container", { scale: 0.98, duration: 520 });
  }

  // VanillaTilt init for cards (optional)
  if (typeof VanillaTilt !== "undefined") {
    document.querySelectorAll(".repository-card, .about-img-container").forEach(el => {
      VanillaTilt.init(el, { max: 6, speed: 300, glare: false, "max-glare": 0.03 });
    });
  }

  // -----------------------
  // Liquify behavior for profile image
  // -----------------------
  const imgStack = document.getElementById("imgStack");
  const turb = document.getElementById("turb"); // feTurbulence element
  const profileBack = document.getElementById("profileBack");

  if (imgStack && turb && profileBack) {
    let animating = false;
    let targetFreq = 0;
    let currentFreq = 0;
    let rafId = null;

    function setTargetFromEvent(e) {
      const rect = imgStack.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx);
      const dy = (e.clientY - cy);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.max(rect.width, rect.height) * 0.6;
      const norm = Math.max(0, 1 - (dist / maxDist)); // 0..1
      const minFreq = 0.002;
      const maxFreq = 0.03;
      targetFreq = minFreq + (maxFreq - minFreq) * norm;
    }

    function step() {
      currentFreq += (targetFreq - currentFreq) * 0.18;
      const val = `${currentFreq.toFixed(4)} ${ (currentFreq * 0.9).toFixed(4) }`;
      turb.setAttribute("baseFrequency", val);
      const scale = Math.round(8 + currentFreq * 220);
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

    imgStack.addEventListener("mouseenter", (e) => { start(); setTargetFromEvent(e); });
    imgStack.addEventListener("mousemove", (e) => { setTargetFromEvent(e); });
    imgStack.addEventListener("mouseleave", (e) => {
      targetFreq = 0;
      setTimeout(() => {
        cancelAnimationFrame(rafId);
        rafId = null;
        animating = false;
        turb.setAttribute("baseFrequency", "0 0");
        const filter = turb.parentNode;
        const disp = filter.querySelector("feDisplacementMap");
        if (disp) disp.setAttribute("scale", "0");
      }, 300);
    });
  }

  // -----------------------
  // Fish follow cursor (white and slightly larger than cursor)
  // -----------------------
  const fish = document.getElementById("fish");
  if (fish) {
    // starting positions
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let fishX = mouseX;
    let fishY = mouseY;
    let lastX = mouseX;
    let lastY = mouseY;
    let vx = 0, vy = 0;
    const ease = 0.14; // follow lag

    // Update mouse target on pointermove / touch
    function handleMove(e) {
      if (e.touches && e.touches.length) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
    }
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });

    // Animation loop
    function animateFish() {
      // lerp
      fishX += (mouseX - fishX) * ease;
      fishY += (mouseY - fishY) * ease;

      // velocity
      vx = (fishX - lastX);
      vy = (fishY - lastY);

      lastX = fishX;
      lastY = fishY;

      // rotation based on velocity
      const angle = Math.atan2(vy, vx) * (180 / Math.PI);
      const speed = Math.min(1.6, Math.hypot(vx, vy) * 0.08);
      const scale = 1 + speed * 0.14;

      // position fish by setting left/top and transform for rotation & scale
      fish.style.left = `${fishX}px`;
      fish.style.top = `${fishY}px`;
      fish.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${scale})`;

      requestAnimationFrame(animateFish);
    }
    requestAnimationFrame(animateFish);

    // reduce opacity when pointer over interactive elements
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

    // keep fish on-screen on resize
    window.addEventListener("resize", () => {
      mouseX = Math.min(window.innerWidth - 6, mouseX);
      mouseY = Math.min(window.innerHeight - 6, mouseY);
    }, { passive: true });
  }
});
