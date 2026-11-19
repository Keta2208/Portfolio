(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var bar = $(".progress"), nav = $("#nav"), last = 0, tick = false;
  var tocLinks = $$(".toc a"), targets = tocLinks.map(function (a) { return $(a.getAttribute("href")); });
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--p", h > 0 ? y / h : 0);
    if (y > 160 && y > last + 4) nav.classList.add("hide"); else if (y < last - 4 || y < 160) nav.classList.remove("hide");
    last = y;
    var mid = window.innerHeight * 0.35, cur = -1;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < mid) cur = i; });
    tocLinks.forEach(function (a, i) { a.classList.toggle("on", i === cur); });
    tick = false;
  }
  window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
  $$(".rv").forEach(function (el) { io.observe(el); });
  setTimeout(function () { document.body.classList.add("loaded"); }, 50);
})();
