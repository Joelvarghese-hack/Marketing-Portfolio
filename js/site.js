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

  /* ── nav ─────────────────────────────────────────────────── */
  const nav = $('#nav');
  const burger = $('.nav-burger');
  const menu = $('#mobile-menu');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 24);
    nav.classList.toggle('hide', y > 600 && y > lastY && menu.hidden);
    lastY = y;
  }, { passive: true });

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

  /* ── reveals ─────────────────────────────────────────────── */
  const rev = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach((el) => rev.observe(el));

  /* ── tools marquee ───────────────────────────────────────── */
  const TOOLS = [
    ['Figma', 'assets/logo-figma.png'], ['Framer', 'assets/logo-framer.svg'], ['Claude Code', 'assets/logo-claude.png'],
    ['Dev Tools', 'assets/logo-devtools.svg'], ['Canva', 'assets/logo-canva.png'], ['Adobe Suite', 'assets/logo-adobe.png'],
    ['CapCut', 'assets/logo-capcut.png'], ['Meta Business Suite', 'assets/logo-meta.png'], ['Gemini AI', 'assets/logo-gemini.png'],
    ['TikTok', 'assets/logo-tiktok.png'],
  ];
  $('#tools-track').innerHTML = [0, 1].map((k) => TOOLS.map(([n, s]) =>
    `<li class="tool"${k ? ' aria-hidden="true"' : ''}><img src="${s}" alt="" loading="lazy" /><span>${n}</span></li>`).join('')).join('');

  /* ── card markup (shared by the arc and the case header) ─── */
  const scr = (src, alt = '') => `<img src="${src}" alt="${esc(alt)}" loading="lazy" draggable="false" />`;
  const laptop = (src) => `<div class="dev laptop"><div class="screen">${scr(src)}</div><div class="base"></div></div>`;
  const phone = (src, cls = '') => `<div class="dev phone ${cls}">${scr(src)}</div>`;
  function mockup(m) {
    switch (m.kind) {
      case 'laptop': return laptop(m.desk);
      case 'laptop-phone': return laptop(m.desk) + phone(m.mob);
      case 'tablet': return `<div class="dev tablet">${scr(m.desk)}</div>`;
      case 'two-phones': return phone(m.a, 'a') + phone(m.b, 'b');
      case 'posters': return ['a', 'b', 'c'].map((k) => `<div class="poster ${k}">${scr(m[k])}</div>`).join('');
      default: return '';
    }
  }
  function cardHTML(p, attrs = '') {
    return `<button class="card${p.tone === 'light' ? ' is-light' : ''}" style="--c:${p.color}" data-id="${p.id}" ${attrs}>
      <span class="card-inner m-${p.mock.kind}">
        <img class="card-logo ${p.logoClass || ''}" src="${p.logo}" alt="" draggable="false" />
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
      const a = wrap(i * A.step - A.offset);
      const x = A.R * Math.sin(a);
      const y = A.R * (1 - Math.cos(a));
      const el = cards[i];
      el._a = a;
      if (Math.abs(x) > lim) { el.style.visibility = 'hidden'; continue; }
      if (el !== state.hiddenCard) el.style.visibility = '';
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${a.toFixed(4)}rad)`;
      el.style.zIndex = String(500 + Math.round(a * 200));
    }
  }

  function tick(t) {
    const dt = Math.min(.05, (t - (A.last || t)) / 1000);
    A.last = t;
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
    layout();
    raf = requestAnimationFrame(tick);
  }
  let raf = 0;

  new IntersectionObserver(([e]) => { A.inView = e.isIntersecting; }, { rootMargin: '120px' }).observe(arc);
  document.addEventListener('visibilitychange', () => { A.last = 0; });

  function nudge(dir) {
    const from = A.offset;
    const to = (Math.round(from / A.step) + dir) * A.step;
    A.vel = 0;
    A.tween = { from, to, t0: performance.now(), d: reduced.matches ? 1 : 650 };
  }
  $('#arc-prev').addEventListener('click', () => nudge(-1));
  $('#arc-next').addEventListener('click', () => nudge(1));
  const playBtn = $('#arc-play');
  function setPaused(p) {
    A.paused = p;
    playBtn.setAttribute('aria-pressed', p);
    playBtn.setAttribute('aria-label', p ? 'Play carousel' : 'Pause carousel');
  }
  playBtn.addEventListener('click', () => setPaused(!A.paused));
  if (reduced.matches) setPaused(true);

  arc.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') A.hover = true; });
  arc.addEventListener('pointerleave', () => { A.hover = false; });
  ring.addEventListener('focusin', () => { A.focus = true; });
  ring.addEventListener('focusout', () => { A.focus = false; });

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
    if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; A.dragging = true; A.tween = null; arc.classList.add('dragging'); }
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
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  ring.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card || suppressClick) return;
    openCase(card.dataset.id, { card, opener: card });
  });
  $('#work-index').addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openCase(b.dataset.open, { opener: b });
  });

  addEventListener('resize', () => { measure(); layout(); });
  measure();
  raf = requestAnimationFrame(tick);

  /* ── case study renderer ─────────────────────────────────── */
  const caseEl = $('#case');

  const cols = (n) => (n % 3 === 0 ? 3 : n % 2 === 0 ? 2 : 3);
  function section(s, i) {
    const head = `<header class="cs-head"><p class="cs-label"><b>${pad(i + 1)}</b>${esc(s.label)}</p><h3 class="cs-title">${esc(s.title || '')}</h3>${s.intro ? `<p class="cs-intro">${esc(s.intro)}</p>` : ''}</header>`;
    let body = '';
    switch (s.type) {
      case 'text':
        body = `<div class="cs-text">${s.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`; break;
      case 'cards':
        body = `<div class="cs-cards" style="--cols:${cols(s.items.length)}">${s.items.map(([h, p], k) => `<article><span class="n">${pad(k + 1)}</span><h4>${esc(h)}</h4><p>${esc(p)}</p></article>`).join('')}</div>`; break;
      case 'steps':
        body = `<ol class="cs-steps">${s.items.map(([kick, h, p], k) => `<li><span class="sn">${k + 1}</span><div><span class="sk">${esc(kick)}</span><h4>${esc(h)}</h4></div><p>${esc(p)}</p></li>`).join('')}</ol>`; break;
      case 'list':
        body = `<ol class="cs-list${s.check ? ' check' : ''}">${s.items.map((t, k) => `<li><span class="ln">${s.check ? CHECK : pad(k + 1)}</span><span>${esc(t)}</span></li>`).join('')}</ol>`; break;
      case 'figure':
        return `<section class="cs"><div class="wrap"><figure class="cs-fig${s.phone ? ' phone-fig' : ''}"><div class="frame" data-lb="${esc(s.src)}" data-cap="${esc(s.caption)}" role="button" tabindex="0" aria-label="View image full size: ${esc(s.alt)}"><img src="${s.src}" alt="${esc(s.alt)}" loading="lazy" /></div><figcaption>${esc(s.caption)}</figcaption></figure></div></section>`;
      case 'swatches':
        body = `<div class="swatches">${s.items.map(([hex, n, u]) => `<div class="${['#FFFFFF'].includes(hex) ? 'lt' : ''}" style="--s:${hex}"><b>${esc(n)}</b><span>${hex} · ${esc(u)}</span></div>`).join('')}</div><p class="sw-note">${esc(s.note)}</p>`; break;
      case 'timeline':
        body = `<ol class="cs-timeline">${s.items.map(([d, h, p]) => `<li><span class="d">${esc(d)}</span><h4>${esc(h)}</h4><p>${esc(p)}</p></li>`).join('')}</ol>`; break;
      case 'persona':
        body = `<div class="persona"><div class="persona-card"><span class="pa">IE</span><div><h4>${esc(s.name)}</h4><p class="mono">${esc(s.sub)}</p></div><ul>${s.traits.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
          <div class="persona-why"><p class="why-t">Why Emma matters</p><p>${esc(s.why)}</p><div class="persona-stats">${s.stats.map(([b, l]) => `<div><b>${esc(b)}</b><span>${esc(l)}</span></div>`).join('')}</div><p class="persona-note">${esc(s.note)}</p></div></div>`; break;
      case 'outcomes':
        body = `<div class="cs-outcomes" style="--cols:${s.items.length === 4 ? 4 : cols(s.items.length)}">${s.items.map(([h, b, p]) => `<article><h4>${esc(h)}</h4><b>${esc(b)}</b><p>${esc(p)}</p></article>`).join('')}</div>`; break;
      case 'gallery':
        body = s.groups.map((g) => `<div class="gal-group">${g.title ? `<p class="gal-title">${esc(g.title)}</p>` : ''}<div class="gal">${g.items.map((it) => {
          const media = it.video && it.poster
            ? `<img src="${it.poster}" alt="${esc(it.t + ', ' + it.cap)}" loading="lazy" /><span class="play">Play</span>`
            : it.video
            ? `<video src="${it.video}#t=0.1" ${it.poster ? `poster="${it.poster}"` : ''} muted playsinline preload="metadata"></video><span class="play">Play</span>`
            : `<img src="${it.src}" alt="${esc((it.t ? it.t + ', ' : '') + it.cap)}" loading="lazy" />`;
          return `<figure class="gal-item${it.plate ? ' plate' : ''}" style="--r:${it.r}"><button type="button" data-lb="${esc(it.video || it.src)}" data-video="${it.video ? 1 : ''}" data-cap="${esc((it.t ? it.t + ' · ' : '') + it.cap)}" aria-label="View ${esc((it.t ? it.t + ', ' : '') + it.cap)} full size">${media}</button>${it.t ? `<figcaption><b>${esc(it.t)}</b><span>${esc(it.cap)}</span></figcaption>` : `<figcaption><span>${esc(it.cap)}</span></figcaption>`}</figure>`;
        }).join('')}</div></div>`).join(''); break;
    }
    return `<section class="cs"><div class="wrap">${head}<div class="cs-body">${body}</div></div></section>`;
  }

  function renderCase(p) {
    const i = PROJECTS.indexOf(p);
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    const live = p.live ? `<a class="btn btn-ink" href="${p.live.href}" target="_blank" rel="noopener noreferrer">${esc(p.live.label)} ${ARROW}</a>` : '';
    const tools = p.tools.length ? `<section class="cs"><div class="wrap"><header class="cs-head"><p class="cs-label"><b>${pad(p.sections.length + 1)}</b>Stack &amp; platforms</p><h3 class="cs-title">Tools used.</h3></header><div class="cs-body"><ul class="cs-tools">${p.tools.map((t) => `<li>${LOGO[t] ? `<img src="${LOGO[t]}" alt="" />` : '<span class="dot"></span>'}${esc(t)}</li>`).join('')}</ul></div></div></section>` : '';
    caseEl.className = 'case' + (p.tone === 'light' ? ' light' : '');
    caseEl.style.setProperty('--c', p.color);
    caseEl.innerHTML = `
      <div class="case-bar">
        <button class="case-back" type="button" data-close>${ARROW_L} Back to work <kbd>Esc</kbd></button>
        <div class="case-pager"><button type="button" data-step="-1" aria-label="Previous case study">${ARROW_L}</button><button type="button" data-step="1" aria-label="Next case study">${ARROW}</button></div>
      </div>
      <header class="case-band">
        <div class="wrap case-band-grid">
          <div>
            <p class="case-eyebrow mono"><span>${pad(i + 1)} / ${pad(PROJECTS.length)}</span><span>${esc(p.eyebrow)}</span></p>
            <h2 class="case-title" id="case-title">${p.headline.map((l) => `<span>${esc(l)}</span>`).join('')}</h2>
            <p class="case-disc">${esc(p.discipline)}</p>
          </div>
          <div class="case-visual" aria-hidden="true">${cardHTML(p, 'tabindex="-1"')}</div>
        </div>
      </header>
      <div class="case-sheet">
        <div class="wrap">
          <div class="case-top">
            <div><p class="case-lede">${esc(p.lede)}</p>${live ? `<div class="case-live">${live}</div>` : ''}</div>
            <dl class="case-meta">${p.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          </div>
          ${p.stats.length ? `<div class="case-stats">${p.stats.map(([b, l]) => `<div><b>${esc(b)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
        </div>
        ${p.sections.map(section).join('')}
        ${tools}
        <footer class="case-end">
          <div class="wrap">
            <div class="case-end-grid">
              <div>
                <p class="mono">Get in touch</p>
                <h3>Let’s work<br />together</h3>
                <p class="contact-mini"><a href="mailto:joelvoffcial101@gmail.com">joelvoffcial101@gmail.com</a><a href="tel:+16476698325">647 669 8325</a></p>
              </div>
              <button type="button" class="case-next" data-goto="${next.id}">
                <span class="mono">Next case study</span>
                <span class="nx"><i style="--c:${next.color}"></i>${esc(next.title)} <svg viewBox="0 0 24 24"><path d="M3 12h17M14 6l6 6-6 6"/></svg></span>
              </button>
            </div>
            <div class="case-foot"><span>© 2026 Joel Varghese. All rights reserved.</span><button type="button" class="btn btn-line btn-sm" data-close>Back to portfolio</button></div>
          </div>
        </footer>
      </div>`;
    // number the section labels in reading order (figures carry none)
    $$('.cs-head .cs-label b', caseEl).forEach((b, k) => { b.textContent = pad(k + 1); });
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

  async function liftOut(card) {
    const b = cardBox(card);
    const fly = makeFly(card);
    Object.assign(fly.style, px(b), { transform: `rotate(${b.a}rad)` });
    state.hiddenCard = card;
    card.style.visibility = 'hidden';
    await fly.animate(
      [{ transform: `rotate(${b.a}rad)` }, { transform: 'translateY(-46px) rotate(0rad) scale(1.07)', boxShadow: '0 60px 90px -40px rgba(0,0,0,.6)' }],
      { duration: 420, easing: EASE, fill: 'forwards' }).finished;
    fly.querySelector('.card-inner').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
    await fly.animate(
      [{ ...px(b), transform: 'translateY(-46px) scale(1.07)', borderRadius: '18px' },
       { left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px', transform: 'none', borderRadius: '0px' }],
      { duration: 640, easing: EASE_IO, fill: 'forwards' }).finished;
    return fly;
  }

  async function dropIn(card) {
    const b = cardBox(card);
    const fly = makeFly(card);
    Object.assign(fly.style, { left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px', borderRadius: '0px' });
    const inner = fly.querySelector('.card-inner');
    inner.style.opacity = '0';
    await fly.animate(
      [{ left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px', transform: 'none', borderRadius: '0px' },
       { ...px(b), transform: 'translateY(-46px) scale(1.07)', borderRadius: '18px', offset: .78 },
       { ...px(b), transform: `rotate(${b.a}rad)`, borderRadius: '18px' }],
      { duration: 880, easing: EASE_IO, fill: 'forwards' }).finished.then(() => {});
    inner.style.opacity = '';
    card.style.visibility = '';
    state.hiddenCard = null;
    fly.remove();
  }

  function showCase(p) {
    renderCase(p);
    caseEl.hidden = false;
    caseEl.scrollTop = 0;
    caseEl.classList.add('pre');
    document.documentElement.classList.add('case-open');
    outside.forEach((el) => el.setAttribute('inert', ''));
    void caseEl.offsetHeight;
    requestAnimationFrame(() => caseEl.classList.remove('pre'));
    $('.case-back', caseEl).focus({ preventScroll: true });
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
  caseEl.addEventListener('scroll', () => {
    const band = $('.case-band', caseEl);
    caseEl.classList.toggle('bar-solid', !!band && caseEl.scrollTop > band.offsetHeight - 80);
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
      : `<img src="${esc(it.dataset.lb)}" alt="${esc(it.dataset.cap || '')}" />`;
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

  /* ── deep link on load (also handles old kingston.html etc.) ─ */
  const m = location.hash.match(/^#work\/([\w-]+)/);
  if (m && byId[m[1]]) openCase(m[1], { push: false });

  /* ── legal dialogs ───────────────────────────────────────── */
  $$('[data-dialog]').forEach((b) => b.addEventListener('click', () => $('#dlg-' + b.dataset.dialog).showModal()));
  $$('dialog.legal').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('.legal-x')) d.close(); });
  });

  /* ── contact form (FormSubmit, same endpoint as before) ───── */
  const form = $('#contact-form');
  const status = $('#form-status');
  $('#form-date').textContent = new Date().toLocaleDateString('en-CA', { day: '2-digit', month: 'short', year: 'numeric' });
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
    if (form.elements._honey.value) { status.textContent = 'Thanks, your message is on its way.'; return; }
    try {
      const res = await fetch('https://formsubmit.co/ajax/joelvoffcial101@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          message: form.elements.message.value.trim(),
          _subject: 'New message from your portfolio',
          _template: 'table',
        }),
      });
      if (!res.ok) throw new Error(res.status);
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
