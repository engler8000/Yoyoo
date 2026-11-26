
(function () {
  var root = document.documentElement;
  try {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
    var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

    /* Discord-Links */
    var DISCORD_URL = "https://discord.gg/yoyoo-codm";
    $$(".discord-link").forEach(function (a) { a.href = DISCORD_URL; a.target = "_blank"; a.rel = "noopener"; });

    if (!("IntersectionObserver" in window)) { root.classList.remove("js"); window.__ready = 1; return; }

    /* ---------- Reveal: spielt bei jedem Betreten erneut, in beide Scrollrichtungen ---------- */
    var rvList = $$(".rv:not(.rule)");
    var rvIO = new IntersectionObserver(function (es) {
      var vh = window.innerHeight;
      es.forEach(function (e) {
        var el = e.target;
        var enough = e.intersectionRatio >= 0.15 || e.intersectionRect.height > vh * 0.3;
        if (e.isIntersecting && enough) el.classList.add("in");
        else if (e.intersectionRatio === 0) el.classList.remove("in");
      });
    }, { threshold: [0, 0.15], rootMargin: "0px 0px -6% 0px" });
    rvList.forEach(function (el) { rvIO.observe(el); });

    /* ---------- Regeln: poppen der Reihe nach auf (runter: 1→12, hoch: 12→1) ---------- */
    var ruleEls = $$(".rule"), ruleDown = true, ruleLastY = window.pageYOffset;
    window.addEventListener("scroll", function () {
      var y = window.pageYOffset;
      if (y !== ruleLastY) { ruleDown = y > ruleLastY; ruleLastY = y; }
    }, { passive: true });
    function showRules(list) {
      list = list.filter(function (el) { return !el.classList.contains("in"); })
                 .sort(function (a, b) { return ruleEls.indexOf(a) - ruleEls.indexOf(b); });
      if (!ruleDown) list.reverse();
      list.forEach(function (el, i) { el.style.setProperty("--d", (i * 170) + "ms"); el.classList.add("in"); });
    }
    function syncRules() {
      var vh = window.innerHeight, lim = vh * 0.94, show = [];
      ruleEls.forEach(function (el) {
        var r = el.getBoundingClientRect(), h = Math.max(r.height, 1);
        var vis = Math.min(r.bottom, lim) - Math.max(r.top, 0);
        if (vis <= 0) el.classList.remove("in");
        else if (vis / h >= 0.15 || vis > vh * 0.3) show.push(el);
      });
      showRules(show);
    }
    var ruleIO = new IntersectionObserver(function (es) {
      var vh = window.innerHeight, show = [];
      es.forEach(function (e) {
        var enough = e.intersectionRatio >= 0.15 || e.intersectionRect.height > vh * 0.3;
        if (e.isIntersecting && enough) show.push(e.target);
        else if (e.intersectionRatio === 0) e.target.classList.remove("in");
      });
      showRules(show);
    }, { threshold: [0, 0.15], rootMargin: "0px 0px -6% 0px" });
    ruleEls.forEach(function (el) { ruleIO.observe(el); });

    /* Sicherheitsnetz: Wenn das Scrollen zur Ruhe kommt, wird der Zustand aller Elemente einmal abgeglichen
       (fängt zu schnelles Scrollen, Sprünge über Anker und Adressleisten-Änderungen am Handy ab). */
    var settleTimer = 0;
    function syncReveals() {
      var vh = window.innerHeight, lim = vh * 0.94;
      var rects = rvList.map(function (el) { return el.getBoundingClientRect(); });
      rvList.forEach(function (el, i) {
        var r = rects[i], h = Math.max(r.height, 1);
        var vis = Math.min(r.bottom, lim) - Math.max(r.top, 0);
        if (vis <= 0) el.classList.remove("in");
        else if (vis / h >= 0.15 || vis > vh * 0.3) el.classList.add("in");
      });
    }

    /* ---------- Aktive Navigation ---------- */
    /* ---------- Partner-Schrittleiste (scrollgesteuert) ---------- */
    var steps = $("#steps"), st = steps ? $$(".st", steps) : [];
    var lines = st.map(function (s) { return $(".line", s); });
    var stState = st.map(function () { return { on: false, f: -1 }; });
    var stepsVis = false;
    function setSteps(on, f) {
      st.forEach(function (s, i) {
        if (stState[i].on !== on(i)) { stState[i].on = on(i); s.classList.toggle("on", on(i)); }
        var v = f(i);
        if (lines[i] && Math.abs(stState[i].f - v) > 0.002) { stState[i].f = v; lines[i].style.setProperty("--f", v.toFixed(3)); }
      });
    }
    function updateSteps() {
      if (!steps) return;
      if (reduce) { setSteps(function () { return true; }, function () { return 1; }); return; }
      var r = steps.getBoundingClientRect(), vh = window.innerHeight, n = st.length;
      var p = clamp((vh * 0.78 - r.top) / (r.height * 0.85), 0, 1);
      var pos = function (i) { return 0.04 + i * (0.9 - 0.04) / (n - 1); };
      setSteps(function (i) { return p >= pos(i); },
               function (i) { return i < n - 1 ? clamp((p - pos(i)) / (pos(i + 1) - pos(i)), 0, 1) : 0; });
    }
    if (steps) new IntersectionObserver(function (es) { stepsVis = es[0].isIntersecting; if (stepsVis) updateSteps(); }, { rootMargin: "25% 0px 25% 0px" }).observe(steps);

    /* ---------- Parallax (nur sichtbare Elemente) ---------- */
    var par = $$("[data-par]"), parParents = [];
    if (!reduce) {
      par.forEach(function (el) { var pe = el.parentElement; pe.__par = pe.__par || []; pe.__par.push(el); });
      var parIO = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var i = parParents.indexOf(e.target);
          if (e.isIntersecting && i < 0) parParents.push(e.target);
          else if (!e.isIntersecting && i >= 0) parParents.splice(i, 1);
        });
      }, { rootMargin: "20% 0px 20% 0px" });
      var seen = [];
      par.forEach(function (el) { if (seen.indexOf(el.parentElement) < 0) { seen.push(el.parentElement); parIO.observe(el.parentElement); } });
    }

    /* ---------- Ein gemeinsamer, gedrosselter Scroll-Frame ---------- */
    var bar = $("#progress"), ticking = false, lastP = -1;
    function frame() {
      ticking = false;
      var vh = window.innerHeight;
      var h = root.scrollHeight - vh;
      var p = h > 0 ? clamp(window.scrollY / h, 0, 1) : 0;
      if (Math.abs(p - lastP) > 0.0005) { lastP = p; bar.style.transform = "scaleX(" + p.toFixed(4) + ")"; }
      if (!reduce && parParents.length) {
        var reads = [];
        parParents.forEach(function (pe) {
          var r = pe.getBoundingClientRect();
          (pe.__par || []).forEach(function (el) {
            var ref = el.hasAttribute("data-top") ? r.top : (r.top + r.height / 2 - vh / 2);
            reads.push([el, ref * parseFloat(el.getAttribute("data-par"))]);
          });
        });
        reads.forEach(function (x) { x[0].style.setProperty("--py", x[1].toFixed(1) + "px"); });
      }
      if (stepsVis || reduce) updateSteps();
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
      clearTimeout(settleTimer); settleTimer = setTimeout(function () { syncReveals(); syncRules(); }, 160);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", onScroll);

    /* ---------- Ein gemeinsamer Zeiger-Handler: Kartenlicht + Hero-Maus ---------- */
    var heroEl = $("#hero"), pm = null, pq = false;
    if (!reduce) {
      document.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        pm = e;
        if (pq) return; pq = true;
        requestAnimationFrame(function () {
          pq = false;
          var t = pm.target && pm.target.closest ? pm.target.closest(".spot") : null;
          if (t) {
            var r = t.getBoundingClientRect();
            t.style.setProperty("--mx", (pm.clientX - r.left) + "px");
            t.style.setProperty("--my", (pm.clientY - r.top) + "px");
          }
          if (!heroEl) return;
          var hr = heroEl.getBoundingClientRect();
          if (pm.clientY >= hr.top && pm.clientY <= hr.bottom) {
            heroEl.style.setProperty("--hx", ((pm.clientX - hr.left) / hr.width - .5).toFixed(3));
            heroEl.style.setProperty("--hy", ((pm.clientY - hr.top) / hr.height - .5).toFixed(3));
          }
        });
      }, { passive: true });
      if (heroEl) heroEl.addEventListener("pointerleave", function () { heroEl.style.setProperty("--hx", 0); heroEl.style.setProperty("--hy", 0); });
    } else { $$(".js .st").forEach(function (s) { s.classList.add("on"); }); }

    /* ---------- Klick-Ripple (delegiert) ---------- */
    document.addEventListener("pointerdown", function (e) {
      var b = e.target.closest ? e.target.closest(".btn") : null;
      if (!b || reduce) return;
      var r = b.getBoundingClientRect(), s = document.createElement("span");
      s.className = "ripple"; s.style.left = (e.clientX - r.left) + "px"; s.style.top = (e.clientY - r.top) + "px";
      b.appendChild(s); setTimeout(function () { s.remove(); }, 650);
    });

    /* ---------- Leuchtpartikel im Hero ---------- */
    if (!reduce && heroEl) {
      var cv = $("#fx"), ctx = cv.getContext("2d"), P = [], W = 0, H = 0, vis = true;
      var size = function () {
        var r = heroEl.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      };
      var spawn = function (init) { return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: 1 + Math.random() * 2.2, v: .2 + Math.random() * .6, s: Math.random() * 6.28, a: .25 + Math.random() * .6 }; };
      size(); window.addEventListener("resize", size);
      var count = window.innerWidth < 700 ? 26 : 52;
      for (var i = 0; i < count; i++) P.push(spawn(true));
      new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(heroEl);
      (function loop(t) {
        if (vis && !document.hidden) {
          ctx.clearRect(0, 0, W, H);
          for (var i = 0; i < P.length; i++) {
            var p = P[i]; p.y -= p.v; p.x += Math.sin(t / 1200 + p.s) * .35;
            if (p.y < -10) P[i] = spawn(false);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
            ctx.fillStyle = "rgba(140,255,200," + (p.a * (.6 + .4 * Math.sin(t / 500 + p.s))) + ")";
            ctx.shadowColor = "#5ee6a0"; ctx.shadowBlur = 10; ctx.fill();
          }
        }
        requestAnimationFrame(loop);
      })(0);
    }

    frame();
    window.__ready = 1;
  } catch (err) {
    root.classList.remove("js"); window.__ready = 1;
    if (window.console) console.error(err);
  }
})();


(function(){document.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest('a[target="_blank"]'):null;if(!a||!a.href||a.href.indexOf("http")!==0)return;e.preventDefault();var u=a.href,w=null;try{w=window.open(u,"_blank");}catch(x){}if(w){try{w.opener=null;}catch(x){}return;}try{window.top.location.href=u;}catch(x){window.location.href=u;}});})();
