(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- intro ---------- */
  var intro = $(".intro");
  function start() { document.body.classList.add("loaded"); }
  var seen = false;
  try { seen = sessionStorage.getItem("kp-intro5") === "1"; } catch (e) {}
  if (!intro || reduce || seen) {
    if (intro) intro.classList.add("done");
    start();
  } else {
    setTimeout(function () { intro.classList.add("go"); }, 900);
    setTimeout(start, 1150);
    setTimeout(function () { intro.classList.add("done"); }, 2200);
    try { sessionStorage.setItem("kp-intro5", "1"); } catch (e) {}
  }

  /* ---------- reveal ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
  $$(".rv").forEach(function (el) { io.observe(el); });

  /* ---------- counters ---------- */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = null;
      cio.unobserve(el);
      if (reduce) { el.textContent = end + suf; return; }
      (function step(t) {
        if (!t0) t0 = t;
        var k = clamp((t - t0) / 1400, 0, 1), v = 1 - Math.pow(1 - k, 4);
        el.textContent = Math.round(end * v) + suf;
        if (k < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---------- scroll: progress, nav, timeline, scrollspy ---------- */
  var nav = $("#nav"), bar = $(".progress"), tl = $("#tl"), lastY = 0, ticking = false;
  var links = $$(".nav-pill li a"), secs = links.map(function (a) { return $(a.getAttribute("href")); });
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--p", h > 0 ? y / h : 0);
    if (y > 160 && y > lastY + 4) nav.classList.add("hide"); else if (y < lastY - 4 || y < 160) nav.classList.remove("hide");
    lastY = y;
    if (tl) {
      var r = tl.getBoundingClientRect(), f = clamp((window.innerHeight * 0.62 - r.top) / r.height, 0, 1);
      tl.style.setProperty("--fill", f.toFixed(4));
    }
    var mid = window.innerHeight * 0.4, cur = -1;
    secs.forEach(function (s, i) { if (s) { var b = s.getBoundingClientRect(); if (b.top < mid && b.bottom > mid) cur = i; } });
    links.forEach(function (a, i) { a.classList.toggle("on", i === cur); });
    var dk = $("#contact").getBoundingClientRect();
    var cd = $(".cursor"); if (cd) cd.classList.toggle("on-dark", dk.top < window.innerHeight / 2);
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- draggable stickers ---------- */
  $$(".drag, .stk").forEach(function (el) {
    var sx, sy, ox = 0, oy = 0, on = false;
    el.addEventListener("pointerdown", function (e) { on = true; sx = e.clientX; sy = e.clientY; el.setPointerCapture(e.pointerId); el.classList.add("dragging"); });
    el.addEventListener("pointermove", function (e) {
      if (!on) return;
      el.style.setProperty("--x", ox + e.clientX - sx + "px"); el.style.setProperty("--y", oy + e.clientY - sy + "px");
    });
    function end(e) {
      if (!on) return; on = false; el.classList.remove("dragging");
      ox += e.clientX - sx; oy += e.clientY - sy;
    }
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  });

  /* ---------- project cards ---------- */
  $$(".pcard").forEach(function (c) {
    function go() { var u = c.getAttribute("data-href"); if (u) window.location.href = u; }
    c.addEventListener("click", go);
    c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  var tabs = $$(".ptabs button"), ind = $(".pind"), panels = $$(".ppanel");
  function place() { var a = $(".ptabs button[aria-selected=true]"); if (a && ind) { ind.style.width = a.offsetWidth + "px"; ind.style.transform = "translateX(" + a.offsetLeft + "px)"; } }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); });
      panels.forEach(function (p) { var on = p.getAttribute("data-panel") === t.getAttribute("data-tab"); p.hidden = !on; p.classList.toggle("on", on); if (on) $$(".rv", p).forEach(function (c) { c.classList.add("in"); }); });
      place();
    });
  });
  place(); window.addEventListener("resize", place); if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  var cp = $("#copy");
  if (cp) cp.addEventListener("click", function () {
    var done = function () { cp.textContent = "Copied"; cp.classList.add("ok"); setTimeout(function () { cp.textContent = "Copy"; cp.classList.remove("ok"); }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText("ketapatel444@gmail.com").then(done, done); else done();
  });
})();
