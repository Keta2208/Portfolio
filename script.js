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

  /* ---------- mouse parallax ---------- */
  if (fine && !reduce) {
    var depthEls = $$("[data-depth]");
    depthEls.forEach(function (el) { var d = parseFloat(el.dataset.depth); el.style.setProperty("--dx", d + "px"); el.style.setProperty("--dy", d * 0.8 + "px"); });
    window.addEventListener("mousemove", function (e) {
      var mx = e.clientX / window.innerWidth - 0.5, my = e.clientY / window.innerHeight - 0.5;
      root.style.setProperty("--mx", mx.toFixed(3)); root.style.setProperty("--my", my.toFixed(3));
    }, { passive: true });
  }

  /* ---------- custom cursor, magnetic ---------- */
  if (fine && !reduce) {
    root.classList.add("has-cursor");
    var ring = $(".cursor"), dot = $(".cursor-dot"), tx = -100, ty = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; dot.style.transform = "translate(" + tx + "px," + ty + "px)"; }, { passive: true });
    (function loop() { rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18; ring.style.transform = "translate(" + rx + "px," + ry + "px)"; requestAnimationFrame(loop); })();
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest("[data-cursor]"), h = e.target.closest("a, button, .sticker, .stk");
      if (t) { ring.textContent = t.dataset.cursor; ring.classList.add("label"); } else { ring.textContent = ""; ring.classList.remove("label"); }
      ring.classList.toggle("hover", !!h && !t);
    });
    $$(".magnetic").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var b = el.getBoundingClientRect();
        el.style.transform = "translate(" + (e.clientX - b.left - b.width / 2) * 0.25 + "px," + (e.clientY - b.top - b.height / 2) * 0.35 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

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
    c.addEventListener("mousemove", function (e) {
      var b = c.getBoundingClientRect(), px = (e.clientX - b.left) / b.width - 0.5, py = (e.clientY - b.top) / b.height - 0.5;
      c.style.setProperty("--sx", e.clientX - b.left + "px"); c.style.setProperty("--sy", e.clientY - b.top + "px");
      if (!reduce) { c.style.setProperty("--ry", (px * 6).toFixed(2) + "deg"); c.style.setProperty("--rx", (-py * 6).toFixed(2) + "deg"); }
    });
    c.addEventListener("mouseleave", function () { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
  });
  var cp = $("#copy");
  if (cp) cp.addEventListener("click", function () {
    var done = function () { cp.textContent = "Copied"; cp.classList.add("ok"); setTimeout(function () { cp.textContent = "Copy"; cp.classList.remove("ok"); }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText("ketapatel444@gmail.com").then(done, done); else done();
  });
})();
