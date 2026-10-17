(() => {
  const content = document.getElementById("content");
  const panel = document.getElementById("summary-panel");
  const toggle = document.getElementById("summary-toggle");
  const closeBtn = document.getElementById("summary-close");
  const title = document.getElementById("summary-title");
  const inner = panel.querySelector(".panel__inner");
  const page = document.getElementById("page");
  const tabs = [...document.querySelectorAll(".tabs a[data-tab]")];
  const sections = tabs.map((a) => document.querySelector(a.getAttribute("href")));
  const mobile = window.matchMedia("(max-width: 900px)");

  /* ---------- Summary panel ---------- */
  function setOpen(open, { focus = true } = {}) {
    content.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    panel.inert = !open;
    // keep the bottom nav centered over the page area, not under the panel
    document.documentElement.style.setProperty("--dock-offset", open && !mobile.matches ? "460px" : "0px");
    if (open) {
      replay();
      if (focus) title.focus({ preventScroll: true });
    } else if (focus) {
      toggle.focus({ preventScroll: true });
    }
  }

  // Replay the staggered "scan" reveal of the summary sections
  function replay() {
    inner.classList.remove("is-scanning");
    void inner.offsetWidth; // restart animation
    inner.classList.add("is-scanning");
  }

  toggle.addEventListener("click", () => setOpen(!content.classList.contains("is-open")));
  closeBtn.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && content.classList.contains("is-open")) setOpen(false);
  });

  // Open by default on desktop; on phones the panel is a full sheet, so start closed.
  content.classList.add("is-init");
  setOpen(!mobile.matches, { focus: false });
  requestAnimationFrame(() => requestAnimationFrame(() => content.classList.remove("is-init")));

  /* ---------- Tabs: highlight the section in view ---------- */
  function setActive(i) {
    tabs.forEach((a, n) => {
      if (n === i) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  function update() {
    const scroller = mobile.matches ? document.documentElement : page;
    const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4;
    const line = (mobile.matches ? window.innerHeight : page.getBoundingClientRect().height) * 0.35 +
      (mobile.matches ? 72 : page.getBoundingClientRect().top);
    let active = 0;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) active = i; });
    if (atBottom && scroller.scrollTop > 0) active = sections.length - 1;
    setActive(active);
  }

  let ticking = false;
  let lockUntil = 0; // ignore scroll updates while a tab click is smooth-scrolling
  const onScroll = () => {
    if (ticking || performance.now() < lockUntil) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };
  page.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // Clicking a tab highlights it right away (the scroll handler keeps it in sync afterwards)
  tabs.forEach((a, i) => a.addEventListener("click", () => {
    setActive(i);
    lockUntil = performance.now() + 900;
    setTimeout(update, 950);
  }));
  update();

  /* Animated icon: plays once on load; clicking it replays the clip */
  document.querySelectorAll(".avatar-video").forEach((video) => {
    video.addEventListener("click", (e) => {
      e.stopPropagation(); // replay without also opening or closing the summary
      video.currentTime = 0;
      video.play();
    });
  });
})();
