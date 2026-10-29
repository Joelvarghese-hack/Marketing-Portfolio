(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
  const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>';
  const ARROW_L = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 8H3M7 4L3 8l4 4"/></svg>';
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7"/></svg>';
  const pad = (n) => String(n).padStart(2, '0');
  // Touch screens skip scroll-linked effects: they can't stay in sync with
  // native scrolling there and only cost frames.
  const touch = matchMedia('(hover: none), (pointer: coarse)');

  // Responsive images: WebP widths listed in js/images.js, original as fallback.
  function srcset(src) {
    const ws = (typeof IMG_W !== 'undefined' && IMG_W[src]) || [];
    const stem = src.replace(/\.[a-z]+$/i, '');
    return ws.map((w) => `${stem}-w${w}.webp ${w}w`).join(', ');
  }
  function pic(src, alt, sizes, extra = '') {
    const ss = srcset(src);
    return `<img src="${src}"${ss ? ` srcset="${ss}" sizes="${sizes}"` : ''} alt="${esc(alt)}" loading="lazy" decoding="async" draggable="false"${extra} />`;
  }
  const largest = (src) => {
    const ws = (typeof IMG_W !== 'undefined' && IMG_W[src]) || [];
    return ws.length ? `${src.replace(/\.[a-z]+$/i, '')}-w${ws[ws.length - 1]}.webp` : src;
  };

  let usedKeyboard = false;
  addEventListener('keydown', (e) => { if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') usedKeyboard = true; }, true);
  addEventListener('pointerdown', () => { usedKeyboard = false; }, true);

  /* ── nav ─────────────────────────────────────────────────── */
  const nav = $('#nav');
  const burger = $('.nav-burger');
  const menu = $('#mobile-menu');
  let lastY = scrollY;
  function updateNav() {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 24 || !menu.hidden);
    nav.classList.toggle('hide', y > 600 && y > lastY + 2 && menu.hidden);
    if (Math.abs(y - lastY) > 2) lastY = y;
  }

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    nav.classList.toggle('scrolled', open || scrollY > 24);
  };
  burger.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  const navLinks = $$('.nav-links a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'services', 'work', 'contact'].forEach((id) => spy.observe(document.getElementById(id)));

  /* ── reveals & motion ────────────────────────────────────── */
  // Titles rise line by line; .rules/.stagger lists arrive in sequence;
  // [data-count] numbers count up; lazy images "develop" once loaded.
  function splitLines(root) {
    $$('.sec-title, .cs-title', root).forEach((h) => {
      if (h.dataset.split) return;
      h.dataset.split = '1';
      h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i)
        .map((part, k) => `<span class="line" style="--k:${k}"><span>${part}</span></span>`).join('');
    });
  }
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const m = el.textContent.match(/^(\D*)([\d,]*\.?\d+)(.*)$/);
    if (!m || reduced.matches) return;
    const [, pre, num, post] = m;
    const target = parseFloat(num.replace(/,/g, ''));
    const dec = (num.split('.')[1] || '').length;
    const fmt = (v) => pre + (num.includes(',')
      ? v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      : v.toFixed(dec)) + post;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1500);
      el.textContent = fmt(k >= 1 ? target : target * (1 - Math.pow(2, -10 * k)));
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(step);
  }
  const vidObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const v = e.target;
      v.src = v.dataset.src;
      v.removeAttribute('data-src');
      vidObs.unobserve(v);
    });
  }, { rootMargin: '300px 0px' });
  function develop(root) {
    $$('video[data-src]', root).forEach((v) => vidObs.observe(v));
    $$('.cs-fig img, .gal-item img', root).forEach((img) => {
      if (img.classList.contains('dev-img')) return;
      img.classList.add('dev-img');
      const ok = () => img.classList.add('ok');
      if (img.complete && img.naturalWidth) requestAnimationFrame(ok);
      else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', ok, { once: true }); }
    });
  }
  const rev = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      rev.unobserve(el);
      if (el.matches('.rules, .stagger')) setTimeout(() => el.classList.add('done'), 1800);
      $$('[data-count]', el).forEach(countUp);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  function observe(root) {
    splitLines(root);
    $$('.rules, .stagger', root).forEach((list) => [...list.children].forEach((c, k) => c.style.setProperty('--k', Math.min(k, 12))));
    $$('.reveal, .rules, .stagger, .write-on', root).forEach((el) => {
      if (el.dataset.obs) return;
      el.dataset.obs = '1';
      rev.observe(el);
    });
    develop(root);
  }

  /* ── tools marquee ───────────────────────────────────────── */
  const TOOLS = [
    ['Figma', 'assets/logo-figma.png'], ['Framer', 'assets/logo-framer.svg'], ['Claude Code', 'assets/logo-claude.png'],
    ['Dev Tools', 'assets/logo-devtools.svg'], ['Canva', 'assets/logo-canva.png'], ['Adobe Suite', 'assets/logo-adobe.png'],
    ['CapCut', 'assets/logo-capcut.png'], ['Meta Business Suite', 'assets/logo-meta.png'], ['Gemini AI', 'assets/logo-gemini.png'],
    ['TikTok', 'assets/logo-tiktok.png'],
  ];
  // Two identical halves, each at least as wide as the screen, so shifting by
  // exactly one half loops with no seam and no empty space.
  const toolsTrack = $('#tools-track');
  const TOOL_SPEED = 80; // px per second
  function buildTools() {
    const chip = (n, s, hidden) => `<li class="tool"${hidden ? ' aria-hidden="true"' : ''}><img src="${s}" alt="" loading="lazy" decoding="async" /><span>${n}</span></li>`;
    toolsTrack.innerHTML = TOOLS.map(([n, s]) => chip(n, s, false)).join('');
    const setW = toolsTrack.scrollWidth;
    const reps = Math.max(1, Math.ceil(innerWidth / setW));
    const half = Array.from({ length: reps }, (_, r) => TOOLS.map(([n, s]) => chip(n, s, r > 0)).join('')).join('');
    toolsTrack.innerHTML = half + half.replaceAll('<li class="tool">', '<li class="tool" aria-hidden="true">');
    toolsTrack.style.setProperty('--loop', `${(setW * reps) / TOOL_SPEED}s`);
  }
  buildTools();
  // Marquees only run while on screen.
  const marqueeObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('paused', !e.isIntersecting));
  });
  $$('.tape, .tools').forEach((el) => marqueeObs.observe(el));
  let toolsW = innerWidth;
  addEventListener('resize', () => { if (Math.abs(innerWidth - toolsW) > 40) { toolsW = innerWidth; buildTools(); } });

  /* ── card markup (shared by the arc and the case header) ─── */
  const WIDE = '(max-width: 600px) 300px, 420px';
  const NARROW = '(max-width: 600px) 120px, 170px';
  const laptop = (src) => `<div class="dev laptop"><div class="screen">${pic(src, '', WIDE)}</div><div class="base"></div></div>`;
  const phone = (src, cls = '') => `<div class="dev phone ${cls}">${pic(src, '', NARROW)}</div>`;
  function mockup(m) {
    switch (m.kind) {
      case 'laptop': return laptop(m.desk);
      case 'laptop-phone': return laptop(m.desk) + phone(m.mob);
      case 'tablet': return `<div class="dev tablet">${pic(m.desk, '', WIDE)}</div>`;
      case 'two-phones': return phone(m.a, 'a') + phone(m.b, 'b');
      case 'posters': return ['a', 'b', 'c'].map((k) => `<div class="poster ${k}">${pic(m[k], '', NARROW)}</div>`).join('');
      default: return '';
    }
  }
  function cardHTML(p, attrs = '') {
    return `<button class="card${p.tone === 'light' ? ' is-light' : ''}" style="--c:${p.color}" data-id="${p.id}" ${attrs}>
      <span class="card-inner m-${p.mock.kind}">
        <img class="card-logo ${p.logoClass || ''}" src="${p.logo}" alt="" decoding="async" draggable="false" />
        ${mockup(p.mock)}
      </span>
      <span class="card-tag">${esc(p.category)}</span>
    </button>`;
  }

  /* ── project index ───────────────────────────────────────── */
  $('#work-index').innerHTML = PROJECTS.map((p, i) => `<li>
    <button type="button" data-open="${p.id}">
      <span class="n">${pad(i + 1)}</span>
      <span class="t"><i style="--c:${p.color}"></i>${esc(p.title)}${p.id === 'bitlane' ? ' <em>New</em>' : ''}</span>
      <span class="k">${esc(p.category)}</span>
      <span class="y">${esc(p.year)}</span>
      ${ARROW}
    </button></li>`).join('');

  /* ── in numbers (figures taken from the case studies) ───── */
  const NUMBERS = [
    ['6', 'Municipalities benchmarked', 'kingston'],
    ['70%', 'Targeted cut in incomplete applications', 'kingston'],
    ['$10,000', 'Mother’s Day fundraising goal', 'spwc'],
    ['+15%', 'Spotify listener target in 60 days', 'kasador'],
    ['7', 'Routes designed and built', 'bitlane'],
    ['5+', 'Brand deliverables produced', 'aurafilms'],
  ];
  $('#num-grid').innerHTML = NUMBERS.map(([v, label, id]) => `<li><button type="button" data-open="${id}">
      <b data-count>${esc(v)}</b><span class="nl">${esc(label)}</span>
      <span class="np"><i style="--c:${byId[id].color}"></i>${esc(byId[id].title)}${ARROW}</span>
    </button></li>`).join('');

  /* ── arc carousel ────────────────────────────────────────── */
  const arc = $('#arc');
  const ring = $('#arc-ring');
  const COPIES = 2;
  const order = [];
  for (let c = 0; c < COPIES; c++) PROJECTS.forEach((p) => order.push(p));
  ring.innerHTML = order.map((p, i) => cardHTML(p,
    i < PROJECTS.length
      ? `aria-label="Open case study: ${esc(p.title)}, ${esc(p.category)}"`
      : 'tabindex="-1" aria-hidden="true"')).join('');
  const cards = $$('.card', ring);

  const state = { open: null, card: null, hiddenCard: null, opener: null, pushed: false, busy: false };
  const A = {
    offset: 0, vel: 0, R: 1200, step: .2, total: 1, cw: 300, W: 1200,
    paused: false, hover: false, focus: false, inView: false, frozen: false, dragging: false,
    tween: null, last: 0,
    spread: reduced.matches ? 1 : 0, dealT0: 0,
  };
  const speed = () => A.step / 3.6; // one card every ~3.6s

  function measure() {
    const c = cards[0];
    A.cw = c.offsetWidth;
    A.W = arc.clientWidth;
    A.R = A.cw * (A.W < 640 ? 3.6 : 4.4);
    A.step = (A.cw * (A.W < 640 ? .86 : .8)) / A.R;
    A.total = A.step * cards.length;
  }
  const wrap = (v) => ((((v + A.total / 2) % A.total) + A.total) % A.total) - A.total / 2;

  function layout() {
    const lim = A.W / 2 + A.cw;
    for (let i = 0; i < cards.length; i++) {
      const true_a = wrap(i * A.step - A.offset);
      const a = true_a * A.spread;
      const x = A.R * Math.sin(a);
      const y = A.R * (1 - Math.cos(a));
      const el = cards[i];
      el._a = a;
      if (Math.abs(x) > lim) { el.style.visibility = 'hidden'; continue; }
      if (el !== state.hiddenCard) el.style.visibility = '';
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${a.toFixed(4)}rad)`;
      el.style.zIndex = String(500 + Math.round(true_a * 200));
    }
  }

  function tick(t) {
    raf = 0;
    const dt = Math.min(.05, (t - (A.last || t)) / 1000);
    A.last = t;
    if (A.dealT0) {
      const k = Math.min(1, (t - A.dealT0) / 1500);
      A.spread = 1 - Math.pow(1 - k, 3);
      if (k >= 1) A.dealT0 = 0;
    }
    if (A.tween) {
      const k = Math.min(1, (t - A.tween.t0) / A.tween.d);
      const e = 1 - Math.pow(1 - k, 3);
      A.offset = A.tween.from + (A.tween.to - A.tween.from) * e;
      if (k >= 1) A.tween = null;
    } else if (!A.dragging && !A.frozen) {
      const target = (A.paused || A.hover || A.focus || !A.inView || reduced.matches) ? 0 : speed();
      A.vel += (target - A.vel) * Math.min(1, dt * 3.2);
      A.offset += A.vel * dt;
    }
    if (A.inView || A.tween || A.dealT0) layout();
    // Keep the loop alive only while something can still move on screen.
    const target = (A.paused || A.hover || A.focus || reduced.matches) ? 0 : speed();
    const moving = A.dealT0 || A.tween || A.dragging || Math.abs(A.vel) > 1e-6 || target > 0;
    raf = (A.inView && !A.frozen && moving) || A.dealT0 || A.tween ? requestAnimationFrame(tick) : 0;
  }
  let raf = 0;
  function wake() { if (!raf) { A.last = 0; raf = requestAnimationFrame(tick); } }

  new IntersectionObserver(([e]) => { A.inView = e.isIntersecting; if (A.inView) wake(); }, { rootMargin: '120px' }).observe(arc);
  // Card screenshots start loading well before the arc is reached, and the
  // deal waits for them (at most 1.2s) so no card is dealt with a blank screen.
  let shotsReady = null;
  function loadShots() {
    if (shotsReady) return shotsReady;
    const imgs = $$('img', ring);
    imgs.forEach((img) => { img.loading = 'eager'; });
    shotsReady = Promise.race([
      Promise.all(imgs.map((img) => img.decode().catch(() => {}))),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
    return shotsReady;
  }
  new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { loadShots(); obs.disconnect(); } }, { rootMargin: '1200px 0px' }).observe(arc);
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    if (A.spread < 1) loadShots().then(() => { A.dealT0 = performance.now(); wake(); });
  }, { threshold: 0.35 }).observe(arc);
  document.addEventListener('visibilitychange', () => { A.last = 0; });

  function nudge(dir) {
    const from = A.offset;
    const to = (Math.round(from / A.step) + dir) * A.step;
    A.vel = 0;
    A.tween = { from, to, t0: performance.now(), d: reduced.matches ? 1 : 650 };
    wake();
  }
  $('#arc-prev').addEventListener('click', () => nudge(-1));
  $('#arc-next').addEventListener('click', () => nudge(1));
  const playBtn = $('#arc-play');
  function setPaused(p) {
    A.paused = p;
    playBtn.setAttribute('aria-pressed', p);
    playBtn.setAttribute('aria-label', p ? 'Play carousel' : 'Pause carousel');
    wake();
  }
  playBtn.addEventListener('click', () => setPaused(!A.paused));
  if (reduced.matches) setPaused(true);

  arc.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') A.hover = true; });
  arc.addEventListener('pointerleave', () => { A.hover = false; wake(); });
  ring.addEventListener('focusin', () => { A.focus = true; });
  ring.addEventListener('focusout', () => { A.focus = false; wake(); });

  // drag with fling
  let drag = null;
  let suppressClick = false;
  arc.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x0: e.clientX, off0: A.offset, lx: e.clientX, lt: performance.now(), v: 0, moved: false, id: e.pointerId };
  });
  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; A.dragging = true; A.tween = null; arc.classList.add('dragging'); wake(); }
    if (!drag.moved) return;
    const now = performance.now();
    const ddt = Math.max(1, now - drag.lt) / 1000;
    drag.v = -((e.clientX - drag.lx) / A.R) / ddt;
    drag.lx = e.clientX; drag.lt = now;
    A.offset = drag.off0 - dx / A.R;
  });
  const endDrag = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    if (drag.moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      A.vel = Math.max(-2.5, Math.min(2.5, drag.v));
    }
    A.dragging = false;
    arc.classList.remove('dragging');
    drag = null;
    wake();
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  ring.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card || suppressClick) return;
    openCase(card.dataset.id, { card, opener: card });
  });
  $('#num-grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openCase(b.dataset.open, { opener: b });
  });
  $('#work-index').addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openCase(b.dataset.open, { opener: b });
  });

  addEventListener('resize', () => { measure(); layout(); });
  measure();
  layout();

  /* ── case study renderer ─────────────────────────────────── */
  const caseEl = $('#case');

  const cols = (n) => (n % 3 === 0 ? 3 : n % 2 === 0 ? 2 : 3);
  const GAL = '(max-width: 600px) 50vw, (max-width: 1100px) 34vw, 440px';
  function section(s, i) {
    const head = `<header class="cs-head reveal"><h3 class="cs-title">${esc(s.title || '')}</h3>${s.intro ? `<p class="cs-intro">${esc(s.intro)}</p>` : ''}</header>`;
    let body = '';
    switch (s.type) {
      case 'text':
        body = `<div class="cs-text">${s.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`; break;
      case 'cards':
        body = `<div class="cs-cards stagger" style="--cols:${cols(s.items.length)}">${s.items.map(([h, p], k) => `<article><span class="n">${pad(k + 1)}</span><h4>${esc(h)}</h4><p>${esc(p)}</p></article>`).join('')}</div>`; break;
      case 'steps':
        body = `<ol class="cs-steps rules">${s.items.map(([kick, h, p], k) => `<li><span class="sn">${k + 1}</span><div><span class="sk">${esc(kick)}</span><h4>${esc(h)}</h4></div><p>${esc(p)}</p></li>`).join('')}</ol>`; break;
      case 'list':
        body = `<ol class="cs-list rules${s.check ? ' check' : ''}">${s.items.map((t, k) => `<li><span class="ln">${s.check ? CHECK : pad(k + 1)}</span><span>${esc(t)}</span></li>`).join('')}</ol>`; break;
      case 'figure':
        return `<section class="cs"><div class="wrap"><figure class="cs-fig reveal${s.phone ? ' phone-fig' : ''}"><div class="frame" data-lb="${esc(s.src)}" data-cap="${esc(s.caption)}" role="button" tabindex="0" aria-label="View image full size: ${esc(s.alt)}">${pic(s.src, s.alt, s.phone ? '340px' : '(max-width: 1360px) calc(100vw - 32px), 1300px', FIG_DIM[s.src] ? ` width="${FIG_DIM[s.src][0]}" height="${FIG_DIM[s.src][1]}"` : '')}</div><figcaption>${esc(s.caption)}</figcaption></figure></div></section>`;
      case 'swatches':
        body = `<div class="swatches stagger">${s.items.map(([hex, n, u]) => `<div class="${['#FFFFFF'].includes(hex) ? 'lt' : ''}" style="--s:${hex}"><b>${esc(n)}</b><span>${hex} · ${esc(u)}</span></div>`).join('')}</div><p class="sw-note">${esc(s.note)}</p>`; break;
      case 'timeline':
        body = `<ol class="cs-timeline stagger">${s.items.map(([d, h, p]) => `<li><span class="d">${esc(d)}</span><h4>${esc(h)}</h4><p>${esc(p)}</p></li>`).join('')}</ol>`; break;
      case 'persona':
        body = `<div class="persona"><div class="persona-card"><span class="pa">IE</span><div><h4>${esc(s.name)}</h4><p class="mono">${esc(s.sub)}</p></div><ul>${s.traits.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
          <div class="persona-why"><h4 class="why-t">Why Emma matters</h4><p>${esc(s.why)}</p><div class="persona-stats stagger">${s.stats.map(([b, l]) => `<div><b data-count>${esc(b)}</b><span>${esc(l)}</span></div>`).join('')}</div><p class="persona-note">${esc(s.note)}</p></div></div>`; break;
      case 'outcomes':
        body = `<div class="cs-outcomes stagger" style="--cols:${s.items.length === 4 ? 4 : cols(s.items.length)}">${s.items.map(([h, b, p]) => `<article><h4>${esc(h)}</h4><b>${esc(b)}</b><p>${esc(p)}</p></article>`).join('')}</div>`; break;
      case 'gallery':
        body = s.groups.map((g) => `<div class="gal-group">${g.title ? `<p class="gal-title">${esc(g.title)}</p>` : ''}<div class="gal stagger">${g.items.map((it) => {
          const media = it.video && it.poster
            ? `${pic(it.poster, it.t + ', ' + it.cap, GAL)}<span class="play">Play</span>`
            : it.video
            ? `<video data-src="${it.video}#t=0.1" muted playsinline preload="metadata"></video><span class="play">Play</span>`
            : pic(it.src, (it.t ? it.t + ', ' : '') + it.cap, GAL);
          return `<figure class="gal-item${it.plate ? ' plate' : ''}" style="--r:${it.r}"><button type="button" data-lb="${esc(it.video || it.src)}" data-video="${it.video ? 1 : ''}" data-cap="${esc((it.t ? it.t + ' · ' : '') + it.cap)}" aria-label="View ${esc((it.t ? it.t + ', ' : '') + it.cap)} full size">${media}</button>${it.t ? `<figcaption><b>${esc(it.t)}</b><span>${esc(it.cap)}</span></figcaption>` : `<figcaption><span>${esc(it.cap)}</span></figcaption>`}</figure>`;
        }).join('')}</div></div>`).join(''); break;
    }
    return `<section class="cs"><div class="wrap">${head}<div class="cs-body">${body}</div></div></section>`;
  }

  function renderCase(p) {
    const i = PROJECTS.indexOf(p);
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    const live = (p.live ? `<a class="btn btn-ink" href="${p.live.href}" target="_blank" rel="noopener noreferrer">${esc(p.live.label)} ${ARROW}</a>` : '')
      + (p.social || []).map((s) => `<a class="case-social" href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.label)}" title="${esc(s.label)}"><img src="${s.icon}" alt="" /></a>`).join('');
    const tools = p.tools.length ? `<section class="cs"><div class="wrap"><header class="cs-head"><h3 class="cs-title">Tools used.</h3></header><div class="cs-body"><ul class="cs-tools stagger">${p.tools.map((t) => `<li>${LOGO[t] ? `<img src="${LOGO[t]}" alt="" />` : '<span class="dot"></span>'}${esc(t)}</li>`).join('')}</ul></div></div></section>` : '';
    caseEl.className = 'case' + (p.tone === 'light' ? ' light' : '');
    caseEl.style.setProperty('--c', p.color);
    caseEl.innerHTML = `
      <div class="case-bar">
        <button class="case-back" type="button" data-close>${ARROW_L} Back to work <kbd>Esc</kbd></button>
        <div class="case-pager"><button type="button" data-step="-1" aria-label="Previous case study">${ARROW_L}</button><button type="button" data-step="1" aria-label="Next case study">${ARROW}</button></div>
      </div>
      <header class="case-band">
        <div class="wrap case-band-grid">
          <div class="case-head">
            <div class="case-title ${p.logoClass || ''}" id="case-title" role="heading" aria-level="2"><img src="${p.logo}" alt="${esc(p.title)}" decoding="async" /></div>
            <p class="case-sub">${esc(p.subtitle)}</p>
          </div>
          <div class="case-visual" aria-hidden="true">${cardHTML(p, 'tabindex="-1"')}</div>
        </div>
      </header>
      <div class="case-sheet">
        <div class="wrap">
          <div class="case-top">
            <div><p class="case-lede">${esc(p.lede)}</p>${live ? `<div class="case-live">${live}</div>` : ''}</div>
            <dl class="case-meta rules">${[...p.meta, ['Focus', p.discipline]].map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          </div>
          ${p.stats.length ? `<div class="case-stats stagger">${p.stats.map(([b, l]) => `<div><b data-count>${esc(b)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
        </div>
        ${p.sections.map(section).join('')}
        ${tools}
        <footer class="case-end">
          <div class="wrap">
            <div class="case-end-grid">
              <div>
                <h3>Let’s work<br />together</h3>
                <p class="contact-mini"><a href="mailto:joelvoffcial101@gmail.com">joelvoffcial101@gmail.com</a><a href="tel:+16476698325">647 669 8325</a></p>
              </div>
              <button type="button" class="case-next" data-goto="${next.id}">
                <span class="nx-l">Next project</span>
                <span class="nx"><i style="--c:${next.color}"></i>${esc(next.title)} <svg viewBox="0 0 24 24"><path d="M3 12h17M14 6l6 6-6 6"/></svg></span>
              </button>
            </div>
            <div class="case-foot"><span>© 2026 Joel Varghese. All rights reserved.</span><div class="footer-legal"><button type="button" data-dialog="terms">Terms &amp; Conditions</button><button type="button" data-dialog="privacy">Privacy Policy</button></div><button type="button" class="btn btn-line btn-sm" data-close>Back to portfolio</button></div>
          </div>
        </footer>
      </div>`;
  }

  /* ── open / close with lift-out ──────────────────────────── */
  const outside = [$('#main'), nav, $('.footer')];
  const EASE = 'cubic-bezier(.22,.8,.2,1)';
  const EASE_IO = 'cubic-bezier(.65,0,.35,1)';

  function bestCard(id) {
    let best = null;
    cards.forEach((c) => {
      if (c.dataset.id !== id || c.style.visibility === 'hidden') return;
      if (!best || Math.abs(c._a) < Math.abs(best._a)) best = c;
    });
    if (!best) return null;
    const r = best.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight && r.left > -r.width / 2 && r.right < innerWidth + r.width / 2 ? best : null;
  }

  function makeFly(card) {
    const fly = card.cloneNode(true);
    fly.classList.add('fly');
    fly.removeAttribute('aria-label');
    fly.setAttribute('aria-hidden', 'true');
    fly.style.visibility = '';
    fly.style.zIndex = '';
    document.body.appendChild(fly);
    return fly;
  }
  function cardBox(card) {
    const r = card.getBoundingClientRect();
    const w = card.offsetWidth, h = card.offsetHeight;
    return { left: r.left + r.width / 2 - w / 2, top: r.top + r.height / 2 - h / 2, width: w, height: h, a: card._a || 0 };
  }
  const px = (b) => ({ left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px' });

  // Transform that maps a full-viewport sheet onto the lifted card's box.
  function sheetToCard(b) {
    const vw = innerWidth, vh = innerHeight;
    const sx = (b.width * 1.07) / vw, sy = (b.height * 1.07) / vh;
    const dx = b.left + b.width / 2 - vw / 2, dy = b.top - 46 + b.height / 2 - vh / 2;
    return { t: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, r: `${18 / sx}px / ${18 / sy}px` };
  }

  async function liftOut(card) {
    const b = cardBox(card);
    const fly = makeFly(card);
    Object.assign(fly.style, px(b), { transform: `rotate(${b.a}rad)` });
    state.hiddenCard = card;
    card.style.visibility = 'hidden';
    const inner = fly.querySelector('.card-inner');
    const lift = fly.animate(
      [{ transform: `rotate(${b.a}rad)` }, { transform: 'translateY(-46px) rotate(0rad) scale(1.07)' }],
      { duration: 400, easing: EASE, fill: 'forwards' });
    inner.animate([{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
    await lift.finished;
    // swap to a full-screen sheet drawn at the card's size, then let it grow
    const m = sheetToCard(b);
    inner.style.display = 'none';
    lift.cancel();
    Object.assign(fly.style, { left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px', transform: m.t, borderRadius: m.r, boxShadow: 'none' });
    await fly.animate(
      [{ transform: m.t, borderRadius: m.r }, { transform: 'none', borderRadius: '0px' }],
      { duration: 600, easing: EASE_IO, fill: 'forwards' }).finished;
    return fly;
  }

  async function dropIn(card) {
    const b = cardBox(card);
    const fly = makeFly(card);
    const inner = fly.querySelector('.card-inner');
    const m = sheetToCard(b);
    inner.style.display = 'none';
    Object.assign(fly.style, { left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px', borderRadius: '0px', boxShadow: 'none', transformOrigin: '50% 50%' });
    await fly.animate(
      [{ transform: 'none', borderRadius: '0px' }, { transform: m.t, borderRadius: m.r }],
      { duration: 560, easing: EASE_IO, fill: 'forwards' }).finished;
    // back to card size, content visible, then settle into its slot
    fly.getAnimations().forEach((a) => a.cancel());
    inner.style.display = '';
    Object.assign(fly.style, px(b), { borderRadius: '', boxShadow: '', transform: 'translateY(-46px) scale(1.07)' });
    inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'forwards' });
    await fly.animate(
      [{ transform: 'translateY(-46px) scale(1.07)' }, { transform: `rotate(${b.a}rad)` }],
      { duration: 380, easing: EASE, fill: 'forwards' }).finished;
    card.style.visibility = '';
    state.hiddenCard = null;
    fly.remove();
  }

  function showCase(p) {
    renderCase(p);
    bandH = 0;
    caseEl.hidden = false;
    caseEl.scrollTop = 0;
    observe(caseEl);
    caseEl.classList.add('pre');
    document.documentElement.classList.add('case-open');
    outside.forEach((el) => el.setAttribute('inert', ''));
    void caseEl.offsetHeight;
    requestAnimationFrame(() => caseEl.classList.remove('pre'));
    (usedKeyboard ? $('.case-back', caseEl) : caseEl).focus({ preventScroll: true });
    document.title = `${p.title} · Joel Varghese`;
  }

  async function openCase(id, { card = null, opener = null, push = true } = {}) {
    const p = byId[id];
    if (!p || state.busy) return;
    if (state.open) { switchCase(id); return; }
    state.busy = true;
    state.open = id;
    state.opener = opener;
    A.frozen = true; A.vel = 0; A.tween = null;
    const src = card || bestCard(id);
    state.card = src;
    if (push) { history.pushState({ case: id }, '', '#work/' + id); state.pushed = true; }
    if (src && !reduced.matches) {
      const fly = await liftOut(src);
      showCase(p);
      fly.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'linear', fill: 'forwards' }).finished.then(() => fly.remove());
    } else {
      showCase(p);
    }
    state.busy = false;
  }

  function switchCase(id) {
    const p = byId[id];
    if (!p || id === state.open) return;
    if (state.hiddenCard) { state.hiddenCard.style.visibility = ''; state.hiddenCard = null; }
    state.open = id;
    state.card = bestCard(id);
    if (state.card) { state.hiddenCard = state.card; state.card.style.visibility = 'hidden'; }
    history.replaceState({ case: id }, '', '#work/' + id);
    showCase(p);
  }

  async function closeCase({ fromPop = false } = {}) {
    if (!state.open || state.busy) return;
    if (!fromPop && state.pushed) { history.back(); return; }
    if (!fromPop) history.replaceState(null, '', '#work');
    state.busy = true;
    const card = state.card && state.card.isConnected ? state.card : null;
    caseEl.classList.add('leaving');
    await new Promise((r) => setTimeout(r, reduced.matches ? 0 : 200));
    document.documentElement.classList.remove('case-open');
    outside.forEach((el) => el.removeAttribute('inert'));
    if (!state.pushed && !card) document.getElementById('work').scrollIntoView({ behavior: 'instant', block: 'start' });
    if (card && !reduced.matches) {
      const run = dropIn(card);
      caseEl.hidden = true;
      await run;
    } else {
      caseEl.hidden = true;
      if (state.hiddenCard) { state.hiddenCard.style.visibility = ''; state.hiddenCard = null; }
    }
    caseEl.className = 'case';
    caseEl.innerHTML = '';
    document.title = 'Joel Varghese · Portfolio';
    const opener = state.opener;
    Object.assign(state, { open: null, card: null, opener: null, pushed: false, busy: false });
    A.frozen = false; A.last = 0;
    wake();
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  }

  caseEl.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-close]')) closeCase();
    const step = t.closest('[data-step]');
    if (step) {
      const i = PROJECTS.findIndex((p) => p.id === state.open);
      switchCase(PROJECTS[(i + Number(step.dataset.step) + PROJECTS.length) % PROJECTS.length].id);
    }
    const go = t.closest('[data-goto]');
    if (go) switchCase(go.dataset.goto);
    const lb = t.closest('[data-lb]');
    if (lb) openLightbox(lb);
  });
  let bandH = 0;
  caseEl.addEventListener('scroll', () => {
    if (!bandH) { const band = $('.case-band', caseEl); bandH = band ? band.offsetHeight : 0; }
    caseEl.classList.toggle('bar-solid', caseEl.scrollTop > bandH - 80);
  }, { passive: true });
  caseEl.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.frame[data-lb]')) { e.preventDefault(); openLightbox(e.target); }
  });

  addEventListener('popstate', () => {
    const m = location.hash.match(/^#work\/([\w-]+)/);
    if (m && byId[m[1]]) {
      if (state.open) switchCase(m[1]);
      else openCase(m[1], { push: false });
    } else if (state.open) {
      state.pushed = false;
      closeCase({ fromPop: true });
    }
  });

  /* ── lightbox ────────────────────────────────────────────── */
  const lb = $('#lightbox');
  let lbItems = [], lbIndex = 0, lbOpener = null;
  function lbRender() {
    const it = lbItems[lbIndex];
    const media = it.dataset.video
      ? `<video src="${esc(it.dataset.lb)}" controls autoplay playsinline></video>`
      : `<img src="${esc(largest(it.dataset.lb))}" alt="${esc(it.dataset.cap || '')}" decoding="async" />`;
    lb.innerHTML = `<div class="lb-bar"><span class="mono">${pad(lbIndex + 1)} / ${pad(lbItems.length)} · ${esc(it.dataset.cap || '')}</span><button type="button" data-lbx aria-label="Close viewer"><svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div>
      <div class="lb-stage">${media}</div>
      <div class="lb-nav">${lbItems.length > 1 ? `<button type="button" data-lbs="-1" aria-label="Previous">${ARROW_L}</button><button type="button" data-lbs="1" aria-label="Next">${ARROW}</button>` : ''}</div>`;
  }
  function openLightbox(el) {
    lbItems = $$('[data-lb]', caseEl);
    lbIndex = Math.max(0, lbItems.indexOf(el));
    lbOpener = el;
    lbRender();
    lb.hidden = false;
    caseEl.setAttribute('inert', '');
    $('[data-lbx]', lb).focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    lb.innerHTML = '';
    caseEl.removeAttribute('inert');
    if (lbOpener) lbOpener.focus({ preventScroll: true });
  }
  lb.addEventListener('click', (e) => {
    if (e.target.closest('[data-lbx]') || e.target === lb || e.target.classList.contains('lb-stage')) return closeLightbox();
    const s = e.target.closest('[data-lbs]');
    if (s) { lbIndex = (lbIndex + Number(s.dataset.lbs) + lbItems.length) % lbItems.length; lbRender(); }
  });

  addEventListener('keydown', (e) => {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { lbIndex = (lbIndex + (e.key === 'ArrowRight' ? 1 : -1) + lbItems.length) % lbItems.length; lbRender(); }
      return;
    }
    if (state.open && e.key === 'Escape') closeCase();
  });

  /* ── back to top (page, or the open case study) ──────────── */
  const toTop = $('#to-top');
  const bar = $('.ring .bar', toTop);
  const RING = 2 * Math.PI * 25;
  bar.style.strokeDasharray = RING;
  function updateToTop() {
    const open = !caseEl.hidden;
    const y = open ? caseEl.scrollTop : scrollY;
    const max = (open ? caseEl.scrollHeight - caseEl.clientHeight : document.documentElement.scrollHeight - innerHeight) || 1;
    toTop.classList.toggle('show', y > innerHeight * 0.8 && menu.hidden && lb.hidden);
    bar.style.strokeDashoffset = RING * (1 - Math.min(1, y / max));
  }
  let caseQueued = false;
  caseEl.addEventListener('scroll', () => {
    if (caseQueued) return;
    caseQueued = true;
    requestAnimationFrame(() => { caseQueued = false; updateToTop(); });
  }, { passive: true });
  addEventListener('resize', updateToTop);
  new MutationObserver(updateToTop).observe(caseEl, { attributes: true, attributeFilter: ['hidden'] });
  burger.addEventListener('click', () => requestAnimationFrame(updateToTop));
  toTop.addEventListener('click', () => {
    const behavior = reduced.matches ? 'auto' : 'smooth';
    if (!caseEl.hidden) { caseEl.scrollTo({ top: 0, behavior }); $('.case-back', caseEl).focus({ preventScroll: true }); }
    else { scrollTo({ top: 0, behavior }); $('.nav-logo').focus({ preventScroll: true }); }
  });
  updateToTop();

  /* ── scroll-linked depth ─────────────────────────────────── */
  const heroWord = $('.hero-word');
  const heroName = $('.hero-name');
  const svcs = $$('.svc');
  const shades = svcs.map((el) => el.appendChild(Object.assign(document.createElement('span'), { className: 'svc-shade' })));
  const svcTops = [];
  function measureSvcs() { svcs.forEach((el, i) => { svcTops[i] = parseFloat(getComputedStyle(el).top) || 0; }); }
  function scrollFx() {
    const fx = !reduced.matches && !touch.matches;
    const y = Math.min(scrollY, innerHeight * 1.2);
    heroWord.style.translate = fx ? `0 ${(y * 0.16).toFixed(1)}px` : '';
    heroName.style.translate = fx ? `0 ${(y * 0.07).toFixed(1)}px` : '';
    const stacked = fx && innerWidth > 600;
    for (let i = 0; i < svcs.length - 1; i++) {
      let p = 0;
      if (stacked) {
        const r = svcs[i].getBoundingClientRect();
        if (r.top <= svcTops[i] + 1) {
          const n = svcs[i + 1].getBoundingClientRect();
          p = Math.max(0, Math.min(1, (r.bottom - n.top) / r.height));
        }
      }
      svcs[i].style.scale = p ? String(1 - 0.05 * p) : '';
      shades[i].style.opacity = p ? String(0.08 * p) : '0';
    }
  }
  let frameQueued = false;
  function frame() { frameQueued = false; updateNav(); updateToTop(); scrollFx(); }
  addEventListener('scroll', () => { if (!frameQueued) { frameQueued = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', () => { measureSvcs(); frame(); });
  measureSvcs();
  frame();

  observe(document);

  /* ── deep link on load (also handles old kingston.html etc.) ─ */
  const m = location.hash.match(/^#work\/([\w-]+)/);
  if (m && byId[m[1]]) openCase(m[1], { push: false });

  /* ── legal dialogs ───────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dialog]');
    if (b) $('#dlg-' + b.dataset.dialog).showModal();
  });
  $$('dialog.legal').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('.legal-x')) d.close(); });
  });

  /* ── contact form (Web3Forms) ────────────────────────────── */
  // Public by design: Web3Forms access keys only allow sending to the inbox they were issued for.
  const WEB3FORMS_KEY = '';
  const form = $('#contact-form');
  const status = $('#form-status');
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Please enter your name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
    message: (v) => v.trim().length >= 10 || 'Please write a little more (10 characters minimum).',
  };
  function check(field) {
    const ok = rules[field.name](field.value);
    const wrapEl = field.closest('.field');
    wrapEl.classList.toggle('bad', ok !== true);
    $('.err', wrapEl).textContent = ok === true ? '' : ok;
    field.setAttribute('aria-invalid', ok !== true);
    return ok === true;
  }
  Object.keys(rules).forEach((n) => {
    const f = form.elements[n];
    f.addEventListener('blur', () => { if (f.value) check(f); });
    f.addEventListener('input', () => { if (f.closest('.field').classList.contains('bad')) check(f); });
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = Object.keys(rules).map((n) => form.elements[n]);
    const valid = fields.map(check).every(Boolean);
    if (!valid) { fields.find((f) => f.getAttribute('aria-invalid') === 'true').focus(); return; }
    status.className = 'form-status';
    status.textContent = 'Sending…';
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    if (form.elements._honey.value) { status.textContent = 'Thanks, your message is on its way.'; btn.disabled = false; return; }
    try {
      if (!WEB3FORMS_KEY) throw new Error('Contact form not configured yet');
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          message: form.elements.message.value.trim(),
          subject: 'New message from your portfolio',
          from_name: 'Joel Varghese Portfolio',
          botcheck: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || res.status);
      form.reset();
      status.className = 'form-status ok';
      status.textContent = 'Thanks, your message is on its way. I’ll get back to you soon.';
    } catch {
      status.className = 'form-status fail';
      status.innerHTML = 'Something went wrong sending that. Please email me directly at <a href="mailto:joelvoffcial101@gmail.com">joelvoffcial101@gmail.com</a>.';
    } finally {
      btn.disabled = false;
    }
  });

  /* ── light image protection (as on the previous site) ─────── */
  document.addEventListener('contextmenu', (e) => { if (e.target.closest('img, video')) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (e.target.closest('img, video')) e.preventDefault(); });
})();
