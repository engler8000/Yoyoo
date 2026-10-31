(() => {
  'use strict';

  // Snow belongs on content cards; keep the header clear.
  const random = (min, max) => min + Math.random() * (max - min);
  const selectSnowy = nodes => Array.from(nodes).filter(() => Math.random() < .65);
  const targets = selectSnowy(document.querySelectorAll('main .spot'));
  targets.forEach(target => {
    target.classList.add('winter-capped');
    const cap = document.createElement('span');
    cap.className = 'winter-cap';
    cap.setAttribute('aria-hidden', 'true');
    const width = random(36, 74);
    cap.style.cssText = `--cap-width:${width}%;--cap-left:${random(5, 95 - width)}%;--cap-height:${random(10, 17)}px`;
    // Uneven mounds and a gently irregular underside instead of identical ovals.
    let outline = 'M0 15';
    for (let x = 0; x < 240; x += 40) {
      outline += ` Q${x + 20} ${random(0, 7)} ${x + 40} ${x === 200 ? 15 : random(5, 11)}`;
    }
    outline += ' Q232 18 218 17';
    for (let x = 218; x > 18; x -= 40) {
      outline += ` Q${x - 20} ${random(18, 23)} ${x - 40} ${random(15, 18)}`;
    }
    outline += ' Q4 18 0 15Z';
    cap.innerHTML = `<svg viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden="true"><path d="${outline}" fill="#f1fafc"/><path d="${outline}" fill="none" stroke="#fff" stroke-width="1"/></svg>`;
    target.append(cap);
    if (target.classList.contains('tier')) {
      const effects = document.createElement('span');
      effects.className = 'winter-card-effects';
      effects.setAttribute('aria-hidden', 'true');
      target.append(effects);
    }
  });

  const header = document.querySelector('header.nav');
  function syncHeaderHeight() {
    document.documentElement.style.setProperty('--winter-header-height', `${header?.getBoundingClientRect().height || 0}px`);
  }
  syncHeaderHeight();
  if (header && 'ResizeObserver' in window) new ResizeObserver(syncHeaderHeight).observe(header);
  window.addEventListener('resize', syncHeaderHeight, { passive: true });

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let snow;
  function syncSnow() {
    if (motion.matches) {
      snow?.remove();
      snow = null;
      return;
    }
    if (snow) return;
    snow = document.createElement('div');
    snow.className = 'winter-snow';
    snow.setAttribute('aria-hidden', 'true');
    const count = Math.round(random(76, 92));
    for (let i = 0; i < count; i++) {
      const flake = document.createElement('span');
      flake.className = 'winter-flake';
      flake.style.cssText = `--left:${random(0, 100)}%;--size:${random(2, 6)}px;--opacity:${random(.4, .85)};--duration:${random(7, 14)}s;--delay:${-random(0, 14)}s;--drift:${random(-65, 65)}px`;
      flake.addEventListener('animationiteration', () => {
        flake.style.setProperty('--left', `${random(0, 100)}%`);
        flake.style.setProperty('--drift', `${random(-65, 65)}px`);
      });
      snow.append(flake);
    }
    document.body.append(snow);
    syncVisibility();
  }
  function syncVisibility() {
    snow?.querySelectorAll('.winter-flake').forEach(flake => {
      flake.style.animationPlayState = document.hidden ? 'paused' : 'running';
    });
  }
  motion.addEventListener('change', syncSnow);
  document.addEventListener('visibilitychange', syncVisibility);
  syncSnow();
})();
