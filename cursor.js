/* Smooth cursor, magnetic buttons, mouse parallax and card tilt: one damped animation loop */
(function () {
  "use strict";
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var ring = document.querySelector(".cursor"), dot = document.querySelector(".cursor-dot");
  if (!ring) {
    ring = document.createElement("div"); ring.className = "cursor"; ring.setAttribute("aria-hidden", "true");
    dot = document.createElement("div"); dot.className = "cursor-dot"; dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring); document.body.appendChild(dot);
  }
  ring.innerHTML = "<span></span>";
  var lab = ring.firstChild;
  root.classList.add("has-cursor");
  ring.style.opacity = dot.style.opacity = "0";

  var tx = 0, ty = 0, rx = 0, ry = 0, seen = false, last = performance.now();
  var tmx = 0, tmy = 0, cmx = 0, cmy = 0;
  var depthEls = $$("[data-depth]");
  depthEls.forEach(function (el) { var d = parseFloat(el.getAttribute("data-depth")); el.style.setProperty("--dx", d + "px"); el.style.setProperty("--dy", d * 0.8 + "px"); });

  var mags = $$(".magnetic").map(function (el) { return { el: el, bx: 0, by: 0, ox: 0, oy: 0, tx: 0, ty: 0 }; });
  mags.forEach(function (m) {
    m.el.addEventListener("mouseenter", function () {
      var b = m.el.getBoundingClientRect(); m.bx = b.left + b.width / 2 - m.ox; m.by = b.top + b.height / 2 - m.oy;
    });
    m.el.addEventListener("mousemove", function (e) { m.tx = (e.clientX - m.bx) * 0.18; m.ty = (e.clientY - m.by) * 0.26; });
    m.el.addEventListener("mouseleave", function () { m.tx = 0; m.ty = 0; });
  });

  var cards = $$(".pcard").map(function (c) { return { c: c, trx: 0, try_: 0, rx: 0, ry: 0 }; });
  cards.forEach(function (k) {
    k.c.addEventListener("mousemove", function (e) {
      var b = k.c.getBoundingClientRect(), px = (e.clientX - b.left) / b.width - 0.5, py = (e.clientY - b.top) / b.height - 0.5;
      k.c.style.setProperty("--sx", e.clientX - b.left + "px"); k.c.style.setProperty("--sy", e.clientY - b.top + "px");
      k.try_ = px * 4; k.trx = -py * 4;
    });
    k.c.addEventListener("mouseleave", function () { k.trx = 0; k.try_ = 0; });
  });

  window.addEventListener("mousemove", function (e) {
    tx = e.clientX; ty = e.clientY; tmx = tx / window.innerWidth - 0.5; tmy = ty / window.innerHeight - 0.5;
    if (!seen) { seen = true; rx = tx; ry = ty; ring.style.opacity = dot.style.opacity = ""; }
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", function () { ring.style.opacity = dot.style.opacity = "0"; });
  document.documentElement.addEventListener("mouseenter", function () { if (seen) ring.style.opacity = dot.style.opacity = ""; });

  document.addEventListener("mouseover", function (e) {
    var t = e.target.closest(".pcard"), h = e.target.closest("a, button, .sticker, .stk");
    if (t) { lab.textContent = "View"; ring.classList.add("label"); } else ring.classList.remove("label");
    ring.classList.toggle("hover", !!h && !t);
  });

  function loop(now) {
    var dt = Math.min(now - last, 40); last = now;
    var kr = 1 - Math.exp(-dt / 65), ke = 1 - Math.exp(-dt / 110), kp = 1 - Math.exp(-dt / 160);
    rx += (tx - rx) * kr; ry += (ty - ry) * kr;
    ring.style.translate = rx.toFixed(2) + "px " + ry.toFixed(2) + "px";
    dot.style.translate = tx + "px " + ty + "px";
    if (!reduce) {
      if (Math.abs(tmx - cmx) + Math.abs(tmy - cmy) > 0.0004) {
        cmx += (tmx - cmx) * kp; cmy += (tmy - cmy) * kp;
        var sx = cmx.toFixed(4), sy = cmy.toFixed(4);
        for (var i = 0; i < depthEls.length; i++) { depthEls[i].style.setProperty("--mx", sx); depthEls[i].style.setProperty("--my", sy); }
      }
      for (var j = 0; j < mags.length; j++) {
        var m = mags[j];
        if (Math.abs(m.tx - m.ox) + Math.abs(m.ty - m.oy) > 0.02) {
          m.ox += (m.tx - m.ox) * ke; m.oy += (m.ty - m.oy) * ke;
          m.el.style.translate = m.ox.toFixed(2) + "px " + m.oy.toFixed(2) + "px";
        }
      }
      for (var q = 0; q < cards.length; q++) {
        var k = cards[q];
        if (Math.abs(k.trx - k.rx) + Math.abs(k.try_ - k.ry) > 0.005) {
          k.rx += (k.trx - k.rx) * ke; k.ry += (k.try_ - k.ry) * ke;
          k.c.style.setProperty("--rx", k.rx.toFixed(3) + "deg"); k.c.style.setProperty("--ry", k.ry.toFixed(3) + "deg");
        }
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
