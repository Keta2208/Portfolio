(function () {
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- Intro / wipe ---------- */
  var intro = $(".intro"), trail = $(".intro-trail"), wipe = $(".wipe");
  function ready() { body.classList.remove("is-intro"); body.classList.add("is-ready"); }

  if (intro) {
    var seen = false;
    try { seen = sessionStorage.getItem("kp-intro2") === "1"; } catch (e) {}
    if (reduce || seen) { intro.remove(); if (trail) trail.remove(); ready(); }
    else {
      body.classList.add("is-intro");
      setTimeout(function () {
        intro.classList.add("done"); trail.classList.add("done");
        setTimeout(ready, 500);
        setTimeout(function () { intro.remove(); trail.remove(); }, 1400);
        try { sessionStorage.setItem("kp-intro2", "1"); } catch (e) {}
      }, 2300);
    }
  } else if (wipe && wipe.classList.contains("cover")) {
    if (reduce) { wipe.classList.remove("cover"); ready(); }
    else {
      wipe.classList.add("instant");
      void wipe.offsetWidth;
      requestAnimationFrame(function () {
        wipe.classList.remove("instant");
        wipe.classList.add("up");
        wipe.classList.remove("cover");
        ready();
      });
    }
  } else { ready(); }

  /* ---------- Page transition out ---------- */
  doc.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || !wipe || reduce) return;
    var href = a.getAttribute("href");
    if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    if (/^(mailto:|tel:|https?:|#)/.test(href)) return;
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    wipe.classList.remove("up", "cover");
    void wipe.offsetWidth;
    wipe.classList.add("cover");
    setTimeout(function () { location.href = a.href; }, 850);
  });
  window.addEventListener("pageshow", function (e) {
    if (e.persisted && wipe) { wipe.classList.remove("cover"); wipe.classList.add("up"); }
  });

  /* ---------- Anchors / menu ---------- */
  $$("a[href^='#']").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = $(a.getAttribute("href")); if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var n = $(".nav"); if (n) n.classList.remove("menu-open");
    });
  });
  var menuBtn = $(".menu-btn");
  if (menuBtn) menuBtn.addEventListener("click", function () {
    var o = $(".nav").classList.toggle("menu-open"); menuBtn.setAttribute("aria-expanded", String(o));
  });

  /* ---------- Reveal + counters ---------- */
  function count(el) {
    var end = parseFloat(el.dataset.count), suf = el.dataset.suffix || "", pre = el.dataset.prefix || "";
    if (reduce) { el.textContent = pre + end + suf; return; }
    var t0 = performance.now(), dur = 1600;
    (function step(t) {
      var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + Math.round(end * e) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(count);
      if (en.target.hasAttribute("data-count")) count(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- Statement words ---------- */
  var stmt = $("[data-words]"), words = [];
  if (stmt) {
    var parts = stmt.textContent.trim().split(/\s+/);
    stmt.innerHTML = "";
    parts.forEach(function (w, i) {
      var s = doc.createElement("span"); s.className = "wd";
      if (w.charAt(0) === "*") { s.className += " em"; w = w.slice(1); }
      s.textContent = w; stmt.appendChild(s); words.push(s);
      if (i < parts.length - 1) stmt.appendChild(doc.createTextNode(" "));
    });
    if (reduce) words.forEach(function (w) { w.style.setProperty("--o", 1); });
  }

  /* ---------- Horizontal journey ---------- */
  var journey = $(".journey"), jpin = $(".journey-pin"), jtrack = $(".jtrack");
  var jmax = 0;
  function sizeJourney() {
    if (!journey) return;
    if (reduce) { journey.classList.add("no-pin"); return; }
    var vw = window.innerWidth, vh = window.innerHeight;
    jmax = Math.max(0, jtrack.scrollWidth - vw + 40);
    journey.style.height = (vh + jmax) + "px";
  }

  /* ---------- Scroll loop ---------- */
  var progress = $(".scroll-progress"), hero = $(".hero"), nav = $(".nav");
  var links = $$(".nav-links a[href^='#']"), secs = $$("main section[id]");
  var snav = $$(".snav a"), phaseEls = $$(".phase");
  var lastY = 0, ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight, max = root.scrollHeight - vh;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    if (nav) {
      if (y > lastY + 6 && y > 240) nav.classList.add("hide");
      else if (y < lastY - 6 || y < 120) nav.classList.remove("hide");
    }
    lastY = y;
    if (hero) hero.style.setProperty("--p", clamp(y / (vh * 0.8), 0, 1).toFixed(3));
    if (words.length && !reduce) {
      var sr = stmt.getBoundingClientRect();
      var t = clamp((vh * 0.85 - sr.top) / (vh * 0.7), 0, 1);
      words.forEach(function (w, i) {
        w.style.setProperty("--o", clamp((t * 1.15 - i / words.length) * words.length / 3, 0, 1).toFixed(2));
      });
    }
    if (journey && !reduce) {
      var jr = journey.getBoundingClientRect();
      var jp = clamp(-jr.top / Math.max(1, jr.height - vh), 0, 1);
      journey.style.setProperty("--jp", jp.toFixed(4));
      jtrack.style.transform = "translate3d(" + (-jp * jmax).toFixed(1) + "px,0,0)";
    }
    if (links.length) {
      var cur = "";
      secs.forEach(function (s) { if (y >= s.offsetTop - vh * 0.4) cur = s.id; });
      links.forEach(function (l) { l.classList.toggle("active", l.getAttribute("href") === "#" + cur); });
    }
    if (snav.length) {
      var act = 0;
      phaseEls.forEach(function (p, i) { if (p.getBoundingClientRect().top < vh * 0.45) act = i; });
      snav.forEach(function (a, i) { a.classList.toggle("active", i === act); });
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", function () { sizeJourney(); req(); });
  sizeJourney(); frame();
  if (doc.fonts) doc.fonts.ready.then(function () { sizeJourney(); frame(); });
  window.addEventListener("load", function () { sizeJourney(); frame(); });

  /* ---------- Project index: filters + peek ---------- */
  var chips = $$("[data-filter]"), rows = $$("[data-group]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var g = c.dataset.filter;
      chips.forEach(function (x) { var on = x === c; x.classList.toggle("active", on); x.setAttribute("aria-pressed", String(on)); });
      var k = 0;
      rows.forEach(function (r) {
        var show = g === "all" || r.dataset.group === g;
        r.hidden = !show;
        if (show && !reduce) {
          r.animate([{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: k * 70, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
          k++;
        }
      });
    });
  });

  var peek = $(".peek");
  if (peek && fine && !reduce) {
    var px = 0, py = 0, cx = 0, cy = 0, shown = false;
    rows.forEach(function (r) {
      r.addEventListener("pointerenter", function () {
        var art = $(".row-art", r); if (!art) return;
        peek.innerHTML = art.innerHTML; peek.className = "peek on " + art.dataset.tone; shown = true;
      });
      r.addEventListener("pointerleave", function () { peek.classList.remove("on"); shown = false; });
    });
    window.addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; }, { passive: true });
    (function loop() {
      cx += (px - cx) * 0.14; cy += (py - cy) * 0.14;
      var rot = clamp((px - cx) * 0.12, -14, 14);
      peek.style.transform = "translate3d(" + (cx + 30) + "px," + (cy - 110) + "px,0) rotate(" + rot.toFixed(2) + "deg) scale(" + (shown ? 1 : 0.7) + ")";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Cursor, magnetic, parallax, stickers ---------- */
  if (fine && !reduce) {
    var ring = $(".cursor"), dot = $(".cursor-dot");
    var tx = -100, ty = -100, qx = tx, qy = ty;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY; body.classList.add("cursor-on");
      dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      var dark = e.target.closest && e.target.closest(".journey, .outro");
      ring.classList.toggle("on-dark", !!dark); dot.classList.toggle("on-dark", !!dark);
      var lab = e.target.closest && e.target.closest("[data-cursor]");
      var hov = e.target.closest && e.target.closest("a, button, .stk");
      ring.classList.toggle("label", !!lab);
      ring.classList.toggle("hover", !!hov && !lab);
      ring.textContent = lab ? lab.dataset.cursor : "";
    }, { passive: true });
    doc.addEventListener("mouseleave", function () { body.classList.remove("cursor-on"); });
    (function loop() {
      qx += (tx - qx) * 0.18; qy += (ty - qy) * 0.18;
      ring.style.transform = "translate3d(" + qx + "px," + qy + "px,0)";
      requestAnimationFrame(loop);
    })();

    $$(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.transition = "transform 120ms linear";
        el.style.transform = "translate(" + ((e.clientX - (r.left + r.width / 2)) * 0.3) + "px," + ((e.clientY - (r.top + r.height / 2)) * 0.4) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 700ms cubic-bezier(.16,1,.3,1)"; el.style.transform = "";
      });
    });

    var depth = $$("[data-depth]");
    if (depth.length) {
      var mx = 0, my = 0, tmx = 0, tmy = 0;
      window.addEventListener("pointermove", function (e) {
        tmx = e.clientX / window.innerWidth - 0.5; tmy = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });
      (function par() {
        mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
        depth.forEach(function (el) {
          var d = parseFloat(el.dataset.depth);
          el.style.translate = (mx * d).toFixed(1) + "px " + (my * d).toFixed(1) + "px";
        });
        requestAnimationFrame(par);
      })();
    }
  }

  /* draggable stickers (works with touch too) */
  $$(".stk").forEach(function (s) {
    var sx = 0, sy = 0, ox = 0, oy = 0, drag = false;
    s.addEventListener("pointerdown", function (e) {
      drag = true; s.classList.add("drag"); s.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY;
      ox = parseFloat(s.style.getPropertyValue("--x")) || 0; oy = parseFloat(s.style.getPropertyValue("--y")) || 0;
    });
    s.addEventListener("pointermove", function (e) {
      if (!drag) return;
      s.style.setProperty("--x", (ox + e.clientX - sx) + "px"); s.style.setProperty("--y", (oy + e.clientY - sy) + "px");
    });
    function up() { drag = false; s.classList.remove("drag"); }
    s.addEventListener("pointerup", up); s.addEventListener("pointercancel", up);
  });

  /* ---------- Phases ---------- */
  $$(".phead").forEach(function (h) {
    h.addEventListener("click", function () {
      var p = h.closest(".phase"), o = p.classList.toggle("open"); h.setAttribute("aria-expanded", String(o));
    });
  });
  function allPhases(o) {
    $$(".phase").forEach(function (p) {
      p.classList.toggle("open", o); var h = $(".phead", p); if (h) h.setAttribute("aria-expanded", String(o));
    });
  }
  var ex = $("[data-expand-all]"), co = $("[data-collapse-all]");
  if (ex) ex.addEventListener("click", function () { allPhases(true); });
  if (co) co.addEventListener("click", function () { allPhases(false); });
  snav.forEach(function (a) {
    a.addEventListener("click", function () {
      var p = $(a.getAttribute("href")); if (p) { p.classList.add("open"); var h = $(".phead", p); if (h) h.setAttribute("aria-expanded", "true"); }
    });
  });
  var ringFg = $(".ring .fg");
  if (ringFg) {
    var rio = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        var pct = parseFloat(ringFg.dataset.pct) / 100;
        ringFg.style.strokeDashoffset = String(339.3 * (1 - pct)); rio.disconnect();
      }
    }, { threshold: 0.3 });
    rio.observe(ringFg);
  }
  if (location.hash) { var tp = $(location.hash); if (tp && tp.classList.contains("phase")) tp.classList.add("open"); }
})();
