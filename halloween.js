
(function () {
  try {
    /* ===== Einstellungen ===== */
    var HW_TOTAL = 10;                                   /* Anzahl Geister */
    var HW_WIN = [                                       /* 10 gültige Codes (60 % Chance) */
      "/halloween-3489367", "/halloween-7261948", "/halloween-5834027", "/halloween-9402715", "/halloween-2658391",
      "/halloween-8173056", "/halloween-4529803", "/halloween-6097284", "/halloween-3716592", "/halloween-1985470"
    ];
    var HW_OTHER = [                                     /* 90 andere Codes (40 % Chance) */
      "/halloween-4255761", "/halloween-8268141", "/halloween-9335443", "/halloween-4000221", "/halloween-9261317",
      "/halloween-4134276", "/halloween-4427778", "/halloween-5408187", "/halloween-2503530", "/halloween-3108911",
      "/halloween-2748538", "/halloween-2383727", "/halloween-4419959", "/halloween-2394120", "/halloween-8051812",
      "/halloween-6214132", "/halloween-6777825", "/halloween-6271803", "/halloween-9626504", "/halloween-6674428",
      "/halloween-6923273", "/halloween-5458228", "/halloween-5736142", "/halloween-4192688", "/halloween-1354383",
      "/halloween-2841795", "/halloween-4032296", "/halloween-4577079", "/halloween-7465014", "/halloween-9702069",
      "/halloween-4349952", "/halloween-1817368", "/halloween-4266740", "/halloween-9434660", "/halloween-1249641",
      "/halloween-2786932", "/halloween-2701161", "/halloween-2040115", "/halloween-4815425", "/halloween-3765818",
      "/halloween-9346503", "/halloween-7851918", "/halloween-9771460", "/halloween-5947322", "/halloween-3876381",
      "/halloween-8966099", "/halloween-8703403", "/halloween-5631666", "/halloween-8368970", "/halloween-3569788",
      "/halloween-7529142", "/halloween-5634545", "/halloween-2538148", "/halloween-4881182", "/halloween-1453253",
      "/halloween-7147706", "/halloween-3791799", "/halloween-9633306", "/halloween-8121263", "/halloween-4110119",
      "/halloween-3821617", "/halloween-6272705", "/halloween-9701892", "/halloween-8122299", "/halloween-9334483",
      "/halloween-1480148", "/halloween-2768848", "/halloween-9517512", "/halloween-3311125", "/halloween-4284828",
      "/halloween-2612030", "/halloween-7592638", "/halloween-6753703", "/halloween-2736846", "/halloween-4485546",
      "/halloween-9792576", "/halloween-6502804", "/halloween-2137722", "/halloween-2433254", "/halloween-4616911",
      "/halloween-9126837", "/halloween-6474359", "/halloween-2389364", "/halloween-6402813", "/halloween-4355570",
      "/halloween-5086448", "/halloween-2515606", "/halloween-2726674", "/halloween-9037890", "/halloween-1400929"
    ];
    var HW_COMMAND = HW_WIN[0];                          /* wird beim Gewinnen zufällig neu gezogen */
    function hwDraw() { var L = Math.random() < 0.6 ? HW_WIN : HW_OTHER; HW_COMMAND = L[Math.floor(Math.random() * L.length)]; }
    var HW_CHANNEL_URL = "https://discord.com/channels/1466880593013772339/1545542262409273394";/* Kanal für den Befehl */
    var HW_SCARES = 3;                                   /* so viele Geister lösen einen Jumpscare aus */
    var HW_LOCK_MS = 3 * 60 * 60 * 1000;                 /* Sperre nach dem Abschluss: 3 Stunden */
    var HW_KEY = "hwDoneAt", hwMemLock = 0;
    function hwGetLock() { try { var v = localStorage.getItem(HW_KEY); if (v) return parseInt(v, 10) || 0; } catch (e) {} return hwMemLock; }
    function hwSetLock() { hwMemLock = Date.now(); try { localStorage.setItem(HW_KEY, String(hwMemLock)); } catch (e) {} }
    function hwLocked() { var t = hwGetLock(); return !!t && (Date.now() - t) < HW_LOCK_MS; }


    var HW_MODE_KEY = 'yoyoo.halloween.mode.v1', HW_GAME_KEY = 'yoyoo.halloween.game.v2';
    // Zehn eindeutige Geister auf den sechs direkt erreichbaren Hauptseiten.
    var HW_PAGES = ['index.html','index.html','index.html','clan.html','clan.html','events.html','events.html','bewerbung.html','regeln.html','impressum.html'];
    var currentPage = location.pathname.split('/').pop() || 'index.html';
    var pageGhostIds = HW_PAGES.map(function(page, id) { return page === currentPage ? id : -1; }).filter(function(id) { return id >= 0; });
    var found = {};
    function readFound() { try { var saved = JSON.parse(sessionStorage.getItem(HW_GAME_KEY)); if (saved && saved.until > Date.now()) return saved.found || {}; } catch(e) {} return {}; }
    function saveFound() { try { sessionStorage.setItem(HW_GAME_KEY, JSON.stringify({found:found,until:Date.now()+HW_LOCK_MS})); } catch(e) {} }
    found = readFound();

    var root = document.documentElement, body = document.body;
    var toggle = document.getElementById("hwToggle");
    if (!toggle) return;
    toggle.hidden = false;

    var PUMP = '<svg viewBox="0 0 120 110" aria-hidden="true"><path d="M56 22c0-9 3-15 9-19l5 6c-4 3-5 7-5 13z" fill="#4c7a2a"/><ellipse cx="34" cy="64" rx="28" ry="38" fill="#e8650a"/><ellipse cx="86" cy="64" rx="28" ry="38" fill="#e8650a"/><ellipse cx="60" cy="64" rx="34" ry="42" fill="#ff8a1f"/><ellipse cx="60" cy="64" rx="16" ry="42" fill="#ff9d3a"/><path d="M30 55l11-17 11 17zM68 55l11-17 11 17z" fill="#ffe27a"/><path d="M57 68h6l-3-7z" fill="#ffe27a"/><path d="M28 74l10 11 8-8 7 10 7-10 8 8 10-11-3 17q-22 12-44 0z" fill="#ffe27a"/></svg>';
    var GHOST = '<svg viewBox="0 0 100 120" aria-hidden="true"><path d="M50 4C24 4 10 24 10 50v58l12-12 12 14 12-14 12 14 12-14 12 14 8-12V50C90 24 76 4 50 4z" fill="currentColor"/><ellipse cx="36" cy="48" rx="7" ry="10" fill="#1b1030"/><ellipse cx="64" cy="48" rx="7" ry="10" fill="#1b1030"/><ellipse cx="50" cy="76" rx="8" ry="11" fill="#1b1030"/><ellipse cx="25" cy="64" rx="6" ry="4" fill="#ffb3d0" opacity=".55"/><ellipse cx="75" cy="64" rx="6" ry="4" fill="#ffb3d0" opacity=".55"/></svg>';
    var SCARY = '<svg viewBox="0 0 200 240" aria-hidden="true"><path d="M100 6C52 6 22 44 22 98v128l22-20 20 28 18-26 18 26 18-26 20 28 22-20V98C160 44 148 6 100 6z" fill="#f4f4ee"/><ellipse cx="66" cy="96" rx="22" ry="34" fill="#000"/><ellipse cx="134" cy="96" rx="22" ry="34" fill="#000"/><circle cx="66" cy="100" r="6" fill="#ff1a1a"/><circle cx="134" cy="100" r="6" fill="#ff1a1a"/><path d="M52 150q48-14 96 0l-6 56q-42 14-84 0z" fill="#000"/><path d="M58 154l8 20 8-18 8 22 8-20 8 22 8-20 8 20 8-18 8 20 6-18" fill="none" stroke="#f4f4ee" stroke-width="5" stroke-linejoin="round"/></svg>';

    /* ===== Elemente ===== */
    function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
    var layer = el("div", "hw-layer"); layer.setAttribute("aria-hidden", "false");
    var vign = el("div", "hw-vignette"); vign.setAttribute("aria-hidden", "true");
    var flash = el("div", "hw-flash"); flash.setAttribute("aria-hidden", "true");
    var hud = el("div", "hw-hud", '<svg viewBox="0 0 100 120" style="color:#eaf2ff" aria-hidden="true"><path d="M50 4C24 4 10 24 10 50v58l12-12 12 14 12-14 12 14 12-14 12 14 8-12V50C90 24 76 4 50 4z" fill="currentColor"/><circle cx="36" cy="48" r="8" fill="#1b1030"/><circle cx="64" cy="48" r="8" fill="#1b1030"/></svg><span aria-live="polite"><b id="hwCount">0</b> / ' + HW_TOTAL + ' Geister gefangen</span>');
    var toast = el("div", "hw-toast");
    var scare = el("div", "hw-scare", SCARY); scare.setAttribute("aria-hidden", "true");
    var modal = el("div", "hw-modal");
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "hwWinT");
    modal.innerHTML = '<div class="hw-card"><div class="hw-big">' + PUMP + '</div><h2 id="hwWinT">Du hast es geschafft!</h2><p>Du hast alle Geister besiegt.</p><p>Nun gehe in <a href="https://discord.com/channels/1466880593013772339/1545542262409273394" target="_blank" rel="noopener" style="color:#ffd27a;text-decoration:underline;font-weight:700">diesen Kanal</a> und löse dort den Code ein:</p><div class="hw-code"><code id="hwCode"></code><button type="button" class="hw-b" id="hwCopy">Kopieren</button></div><div class="hw-actions"><a class="hw-b" id="hwGo" target="_blank" rel="noopener">Zum Discord-Server</a><button type="button" class="hw-b ghost" id="hwClose">Schließen</button></div></div>';
    [vign, layer, hud, toast, scare, modal, flash].forEach(function (n) { body.appendChild(n); });
    var countEl = document.getElementById("hwCount");
    document.getElementById("hwGo").href = HW_CHANNEL_URL;

    /* ===== Layout: Ebene deckt die ganze Seite ab, Kürbisse an den Rändern ===== */
    var pumpEls = [];
    function docHeight() {
      var f = document.querySelector("footer");
      return Math.ceil(f ? f.getBoundingClientRect().bottom + window.scrollY : root.scrollHeight);
    }
    function layout() {
      var H = docHeight(), W = root.clientWidth, mob = W < 700;
      layer.style.height = H + "px";
      pumpEls.forEach(function (p) { p.remove(); }); pumpEls = [];
      var step = mob ? 700 : 820, size = mob ? 62 : 104, i = 0;
      for (var y = mob ? 640 : 520; y < H - 200; y += step, i++) {
        var left = i % 2 === 0, s = size * (0.85 + ((i * 37) % 30) / 100);
        var p = el("div", "hw-pump", PUMP);
        p.style.setProperty("--s", s + "px");
        p.style.setProperty("--r", (left ? 8 : -8) + "deg");
        p.style.setProperty("--d", (0.15 + (i % 5) * 0.12) + "s");
        p.style.top = y + "px";
        p.style[left ? "left" : "right"] = (mob ? -s * 0.38 : -s * 0.18) + "px";
        layer.appendChild(p); pumpEls.push(p);
      }
    }
    var raf = 0;
    function relayout() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; layout(); }); }
    window.addEventListener("resize", relayout);
    window.addEventListener("load", relayout);
    if (window.ResizeObserver) { try { new ResizeObserver(relayout).observe(body); } catch (e) {} }

    /* ===== Geister ===== */
    var ghosts = [], caught = 0, scareIdx = {}, playing = false, ctx = null, toastT = 0;
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function initGame() {
      ghosts.forEach(function (g) { g.remove(); }); ghosts = []; caught = Object.keys(found).length; scareIdx = {};
      countEl.textContent = String(caught);
      var H = docHeight(), W = root.clientWidth, mob = W < 700, tints = ["#eaf2ff", "#f1e8ff", "#e6ffee", "#fff4e0"];
      var order = []; for (var k = 0; k < HW_TOTAL; k++) order.push(k);
      order.sort(function () { return Math.random() - .5; });
      for (var s = 0; s < Math.min(HW_SCARES, HW_TOTAL); s++) scareIdx[order[s]] = 1;
      for (var i = 0; i < HW_TOTAL; i++) {
        if (HW_PAGES[i] !== currentPage || found[i]) continue;
        var slot = pageGhostIds.indexOf(i);
        var yPx = 180 + ((slot + rnd(.25, .75)) / Math.max(1, pageGhostIds.length)) * Math.max(100, H - 420);
        yPx = Math.max(200, Math.min(H - 220, yPx));
        var g = el("button", "hw-ghost", GHOST); g.type = "button"; g.setAttribute("aria-label", "Geist fangen");
        g.style.setProperty("--x", (i === 0 ? rnd(8, 40) : rnd(4, 84)).toFixed(1));
        g.style.setProperty("--y", (yPx / H * 100).toFixed(3));
        g.style.setProperty("--s", Math.round(mob ? rnd(52, 66) : rnd(58, 84)) + "px");
        g.style.setProperty("--dx", Math.round(rnd(mob ? 18 : 30, mob ? 40 : 90)) * (Math.random() < .5 ? -1 : 1) + "px");
        g.style.setProperty("--dy", Math.round(rnd(14, 44)) + "px");
        g.style.setProperty("--dur", rnd(8, 14).toFixed(1) + "s");
        g.style.setProperty("--dl", (-rnd(0, 10)).toFixed(1) + "s");
        g.style.setProperty("--op", rnd(.62, .92).toFixed(2));
        g.style.setProperty("--gc", tints[i % tints.length]);
        g.dataset.i = i;
        g.addEventListener("click", onCatch);
        layer.appendChild(g); ghosts.push(g);
      }
    }

    /* ===== Töne und Haptik ===== */
    function audio() {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      if (!ctx) ctx = new AC(); if (ctx.resume) ctx.resume(); return ctx;
    }
    function blip() {
      try { var c = audio(); if (!c) return; var t = c.currentTime, o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(760, t); o.frequency.exponentialRampToValueAtTime(220, t + .22);
        g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.0001, t + .25); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .26); } catch (e) {}
    }
    function scream() {
      try { var c = audio(); if (!c) return; var t = c.currentTime, m = c.createGain();
        m.gain.setValueAtTime(.0001, t); m.gain.exponentialRampToValueAtTime(.35, t + .03); m.gain.exponentialRampToValueAtTime(.0001, t + 1.15); m.connect(c.destination);
        [880, 1320, 622].forEach(function (f) { var o = c.createOscillator(), og = c.createGain(); o.type = "sawtooth";
          o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .35, t + 1); og.gain.value = .2; o.connect(og); og.connect(m); o.start(t); o.stop(t + 1.15); });
        var len = Math.floor(c.sampleRate * 1.15), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        var s = c.createBufferSource(), f = c.createBiquadFilter(); s.buffer = buf; f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = .7;
        s.connect(f); f.connect(m); s.start(t); } catch (e) {}
    }
    function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

    var lockT = 0;
    function hwFmt(ms) {
      var m = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(m / 60); m = m % 60;
      return (h ? h + " Std." : "") + (h && m ? " " : "") + (m || !h ? m + " Min." : "");
    }
    function showLock() {                                 /* Live-Countdown bis der Modus wieder frei ist */
      var tick = function () {
        var r = Math.max(0, HW_LOCK_MS - (Date.now() - hwGetLock()));
        if (r <= 0 || !toast.classList.contains("on")) { if (r <= 0) toast.textContent = "Der Halloween-Modus ist wieder verfügbar!"; clearInterval(lockT); return; }
        toast.textContent = "Du kannst es in " + hwFmt(r) + " wieder machen.";
      };
      say("", 9000); tick(); lockT = setInterval(tick, 1000);
    }
    function say(msg, ms) {
      clearInterval(lockT);
      toast.textContent = msg; toast.classList.add("on"); clearTimeout(toastT);
      toastT = setTimeout(function () { toast.classList.remove("on"); }, ms || 3800);
    }

    /* ===== Fangen ===== */
    function onCatch(e) {
      var g = e.currentTarget; if (g.classList.contains("caught") || !playing) return;
      g.classList.add("caught"); found[g.dataset.i] = true; saveFound(); caught++; countEl.textContent = caught;
      hud.classList.remove("bump"); void hud.offsetWidth; hud.classList.add("bump");
      var scary = !!scareIdx[g.dataset.i], delay = 450;
      if (scary) { blip(); setTimeout(doScare, 120); delay = 1700; } else { blip(); vib(30); }
      setTimeout(function () { g.remove(); }, 600);
      if (caught >= HW_TOTAL) { setTimeout(win, delay); }
      else if (!scary && caught === 1) { say("Weiter so! Es sind noch " + (HW_TOTAL - caught) + " Geister versteckt.", 2800); }
    }
    function doScare() {
      scare.classList.remove("on"); void scare.offsetWidth; scare.classList.add("on");
      scream(); vib([90, 40, 180]);
      setTimeout(function () { scare.classList.remove("on"); }, 1350);
    }
    function win() {
      if (!playing) return;
      hwSetLock();                                       /* Sperre (3 Stunden) startet sobald alle Geister gefangen sind */
      hwDraw(); document.getElementById("hwCode").textContent = HW_COMMAND;
      modal.classList.add("on"); vib([60, 40, 60, 40, 120]);
      var c = document.getElementById("hwClose"); if (c) c.focus();
    }
    function closeModal() { modal.classList.remove("on"); }
    function dismiss() { closeModal(); if (playing && hwLocked()) setMode(false); }
    document.getElementById("hwClose").addEventListener("click", dismiss);
    modal.addEventListener("click", function (e) { if (e.target === modal) dismiss(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("on")) dismiss(); });

    var copyBtn = document.getElementById("hwCopy");
    copyBtn.addEventListener("click", function () {
      var done = function (ok) {
        copyBtn.textContent = ok ? "Kopiert ✓" : "Markiert – lange drücken";
        setTimeout(function () { copyBtn.textContent = "Kopieren"; }, 2200);
      };
      var fallback = function () {
        try {
          var r = document.createRange(), code = document.getElementById("hwCode"); r.selectNodeContents(code);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
          var ta = document.createElement("textarea"); ta.value = HW_COMMAND; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select(); var ok = document.execCommand("copy"); ta.remove();
          if (!ok) { sel.removeAllRanges(); sel.addRange(r); } done(ok);
        } catch (e) { done(false); }
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(HW_COMMAND).then(function () { done(true); }, fallback);
        else fallback();
      } catch (e) { fallback(); }
    });

    /* ===== Schalter ===== */
    var reduce = false; try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    var modeGeneration = 0;
    function setMode(on, restoring) {
      var generation = ++modeGeneration;
      root.classList.remove("hw-exiting");
      root.classList.toggle("hw-restored", !!restoring);
      try { sessionStorage.setItem(HW_MODE_KEY, on ? "on" : "off"); } catch(e) {}
      toggle.setAttribute("aria-checked", on ? "true" : "false");
      if (on) {
        if (!hwLocked() && (!ghosts.length || caught >= HW_TOTAL)) { if (caught >= HW_TOTAL) { found = {}; saveFound(); } layout(); initGame(); }
        if (!restoring && !reduce) { flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); }
        function activate() {
          if (generation !== modeGeneration) return;
          root.classList.add("hw"); playing = !hwLocked(); layout();
          if (!restoring) setTimeout(function () { if (generation === modeGeneration && playing) say("Halloween-Modus! Fange insgesamt " + HW_TOTAL + " Geister auf Home, Clan, Events, Bewerbung, Regeln und Impressum – dein Fortschritt bleibt beim Seitenwechsel erhalten.", 5200); }, 900);
        }
        if (restoring || reduce) activate(); else setTimeout(activate, 300);
        if (!restoring) blip();
      } else {
        playing = false; flash.classList.remove("go"); closeModal(); scare.classList.remove("on"); toast.classList.remove("on");
        root.classList.add("hw-exiting");
        setTimeout(function () {
          if (generation !== modeGeneration) return;
          root.classList.remove("hw", "hw-exiting", "hw-restored");
        }, reduce ? 0 : 650);
      }
      updateAway();
    }
    toggle.addEventListener("click", function () {
      var turnOn = toggle.getAttribute("aria-checked") !== "true";
      if (turnOn && hwLocked()) { showLock(); return; }
      setMode(turnOn);
    });

    function updateAway() {
      var on = toggle.getAttribute("aria-checked") === "true";
      toggle.classList.toggle("away", !on && window.scrollY > window.innerHeight * 0.7);
    }
    window.addEventListener("scroll", updateAway, { passive: true });
    updateAway();
    try { if (sessionStorage.getItem(HW_MODE_KEY) === "on") setMode(true, true); } catch(e) {}
  } catch (err) { /* Halloween-Modus ist optional, die Seite läuft auch ohne */ }
})();

