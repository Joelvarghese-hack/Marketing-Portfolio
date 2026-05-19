// ── Anti-download protection ───────────────────────────────
(function(){
  document.addEventListener('contextmenu', function(e){ e.preventDefault(); return false; });
  document.addEventListener('keydown', function(e){
    var k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ['s','u','p','a'].indexOf(k) !== -1) { e.preventDefault(); return false; }
    if (k === 'escape') closeLightbox();
  });
  document.addEventListener('dragstart', function(e){
    if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO')) { e.preventDefault(); return false; }
  });
})();

// ── Lightbox ────────────────────────────────────────────────
var lbBackdrop = null;
var lbFrame = null;
var lbCloseBtn = null;

function buildLightbox() {
  if (lbBackdrop) return;
  lbBackdrop = document.createElement('div');
  lbBackdrop.className = 'lb-backdrop';
  lbBackdrop.setAttribute('role', 'dialog');
  lbBackdrop.setAttribute('aria-modal', 'true');
  lbFrame = document.createElement('div');
  lbFrame.className = 'lb-frame';
  lbBackdrop.appendChild(lbFrame);
  lbCloseBtn = document.createElement('button');
  lbCloseBtn.className = 'lb-close';
  lbCloseBtn.setAttribute('aria-label', 'Close');
  lbCloseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  lbBackdrop.appendChild(lbCloseBtn);
  document.body.appendChild(lbBackdrop);
  lbBackdrop.addEventListener('click', function(e){ if (e.target === lbBackdrop) closeLightbox(); });
  lbCloseBtn.addEventListener('click', closeLightbox);
}

function openLightbox(src, type) {
  buildLightbox();
  lbFrame.classList.remove('pdf-mode', 'video-mode', 'gallery-mode');
  lbBackdrop.classList.remove('scroll-mode');
  lbFrame.innerHTML = '';
  if (type === 'image') {
    var img = document.createElement('img');
    img.src = src; img.alt = '';
    img.setAttribute('draggable', 'false');
    img.oncontextmenu = function(){ return false; };
    lbFrame.appendChild(img);
  } else if (type === 'video') {
    lbFrame.classList.add('video-mode');
    var vid = document.createElement('video');
    vid.src = src;
    vid.controls = true;
    vid.autoplay = true;
    vid.setAttribute('controlsList', 'nodownload noplaybackrate');
    vid.setAttribute('disablePictureInPicture', '');
    vid.setAttribute('playsinline', '');
    vid.oncontextmenu = function(){ return false; };
    lbFrame.appendChild(vid);
  } else if (type === 'gallery') {
    // Multi-page document shown as vertically stacked images.
    // The BACKDROP scrolls (not a nested container) so iOS Safari can
    // always reach the very top and the very bottom smoothly.
    lbFrame.classList.add('gallery-mode');
    lbBackdrop.classList.add('scroll-mode');
    var urls = src.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    var container = document.createElement('div');
    container.className = 'lb-gallery';
    urls.forEach(function(u){
      var img = document.createElement('img');
      img.src = u;
      img.setAttribute('draggable', 'false');
      img.oncontextmenu = function(){ return false; };
      container.appendChild(img);
    });
    lbFrame.appendChild(container);
  } else if (type === 'pdf') {
    lbFrame.classList.add('pdf-mode');
    var iframe = document.createElement('iframe');
    iframe.src = src + '#toolbar=0&navpanes=0&view=FitH';
    iframe.title = 'Document viewer';
    lbFrame.appendChild(iframe);
  }
  document.body.style.overflow = 'hidden';
  // Force reflow then add .show for transition
  void lbBackdrop.offsetWidth;
  lbBackdrop.classList.add('show');
  // Always start at the very top (gallery uses backdrop scroll, others use frame)
  requestAnimationFrame(function(){
    lbBackdrop.scrollTop = 0;
    lbFrame.scrollTop = 0;
  });
}

function closeLightbox() {
  if (!lbBackdrop || !lbBackdrop.classList.contains('show')) return;
  lbBackdrop.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(function(){
    if (lbFrame) {
      var v = lbFrame.querySelector('video');
      if (v) try { v.pause(); } catch (e) {}
      lbFrame.innerHTML = '';
      lbFrame.classList.remove('pdf-mode', 'video-mode', 'gallery-mode');
    }
    if (lbBackdrop) lbBackdrop.classList.remove('scroll-mode');
  }, 300);
}

// ── Sparkle effect on hover ─────────────────────────────────
(function(){
  var STARS = ['✦','✧','★','✶','·'];
  var cooldowns = new WeakMap();
  function spawnSparkles(frame, e) {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var now = Date.now();
    if (cooldowns.has(frame) && now - cooldowns.get(frame) < 220) return;
    cooldowns.set(frame, now);
    var rect = frame.getBoundingClientRect();
    var cx = e.clientX - rect.left;
    var cy = e.clientY - rect.top;
    var count = 6;
    for (var i = 0; i < count; i++) {
      (function(idx){
        setTimeout(function(){
          // Dot particle
          var dot = document.createElement('div');
          dot.className = 'sparkle-dot';
          var size = 6 + Math.random() * 10;
          var angle = (Math.PI * 2 * idx / count) + (Math.random() - 0.5) * 0.7;
          var dist = 24 + Math.random() * 36;
          dot.style.cssText = [
            'left:' + (cx - size/2) + 'px',
            'top:' + (cy - size/2) + 'px',
            'width:' + size + 'px',
            'height:' + size + 'px',
            '--dx:' + (Math.cos(angle) * dist) + 'px',
            '--dy:' + (Math.sin(angle) * dist - 10) + 'px',
          ].join(';');
          frame.appendChild(dot);
          setTimeout(function(){ dot.remove(); }, 750);

          // Star glyph (every other)
          if (idx % 2 === 0) {
            var star = document.createElement('span');
            star.className = 'sparkle-star';
            star.textContent = STARS[Math.floor(Math.random() * STARS.length)];
            var sAngle = angle + 0.4;
            var sDist = 20 + Math.random() * 28;
            star.style.cssText = [
              'left:' + (cx - 7 + (Math.random()-0.5)*12) + 'px',
              'top:' + (cy - 7) + 'px',
              '--dy:' + (-(sDist + 10)) + 'px',
              '--rot:' + (Math.random() > 0.5 ? '' : '-') + (20 + Math.floor(Math.random()*40)) + 'deg',
            ].join(';');
            frame.appendChild(star);
            setTimeout(function(){ star.remove(); }, 900);
          }
        }, idx * 35);
      })(i);
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.item-frame').forEach(function(frame){
      var raf = 0;
      frame.addEventListener('mousemove', function(e){
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function(){ spawnSparkles(frame, e); });
      });
    });
  });
})();

// Attach click handlers to all .item-frame[data-lb-src]
document.addEventListener('DOMContentLoaded', function(){
  var frames = document.querySelectorAll('.item-frame[data-lb-src]');
  frames.forEach(function(f){
    f.addEventListener('click', function(){
      var src = f.getAttribute('data-lb-src');
      var type = f.getAttribute('data-lb-type') || 'image';
      openLightbox(src, type);
    });
  });

  // Footer copy-to-clipboard rows
  var toast = document.getElementById('dw-copy-toast');
  document.querySelectorAll('[data-copy]').forEach(function(el){
    el.addEventListener('click', function(){
      var text = el.getAttribute('data-copy');
      var label = el.getAttribute('data-label') || 'Text';
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(function(){
        if (!toast) return;
        toast.textContent = label + ' copied!';
        toast.classList.add('show');
        setTimeout(function(){ toast.classList.remove('show'); }, 1800);
      });
    });
  });

  // Scroll-to-top button
  var btn = document.getElementById('scroll-top-btn');
  if (btn) {
    function update(){
      if (window.scrollY > window.innerHeight * 0.5) btn.classList.add('show');
      else btn.classList.remove('show');
    }
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: 'smooth' }); });
    update();
  }
});
