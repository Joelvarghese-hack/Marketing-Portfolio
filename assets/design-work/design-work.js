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
  lbFrame.classList.remove('pdf-mode', 'video-mode');
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
  } else if (type === 'pdf') {
    lbFrame.classList.add('pdf-mode');
    var iframe = document.createElement('iframe');
    // Hide PDF toolbar (download button); FitH so PDF auto-fits to width
    // and scrolls vertically for multi-page documents
    iframe.src = src + '#toolbar=0&navpanes=0&view=FitH';
    iframe.title = 'Document viewer';
    lbFrame.appendChild(iframe);
  }
  document.body.style.overflow = 'hidden';
  // Force reflow then add .show for transition
  void lbBackdrop.offsetWidth;
  lbBackdrop.classList.add('show');
}

function closeLightbox() {
  if (!lbBackdrop || !lbBackdrop.classList.contains('show')) return;
  lbBackdrop.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(function(){
    if (lbFrame) {
      // Pause any video before clearing
      var v = lbFrame.querySelector('video');
      if (v) try { v.pause(); } catch (e) {}
      lbFrame.innerHTML = '';
      lbFrame.classList.remove('pdf-mode');
    }
  }, 300);
}

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
