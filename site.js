(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAGE_NAMES = {
    'index.html': 'หน้าแรก',
    'gameplay.html': 'ระบบเกม',
    'howto.html': 'วิธีเล่น',
    'gallery.html': 'ภาพและเทรลเลอร์',
    'download.html': 'ดาวน์โหลด',
    'about.html': 'ผู้จัดทำและเล่มโครงงาน'
  };
  function store(k, v) {
    try {
      if (v === undefined) return sessionStorage.getItem(k);
      if (v === null) sessionStorage.removeItem(k);
      else sessionStorage.setItem(k, v);
    } catch (e) { return null; }
  }

  // ---------- 1. ม่านเปลี่ยนหน้า ----------
  function makeCurtain(label) {
    var c = document.createElement('div');
    c.className = 'curtain';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="c-box"><img src="images/logo.png" alt=""><span></span></div>';
    c.querySelector('span').textContent = label || '';
    document.body.appendChild(c);
    return c;
  }
  var came = store('cls-nav');
  if (came && !reduce) {
    store('cls-nav', null);
    var cIn = makeCurtain(came);
    cIn.classList.add('opening');
    var done = function () { if (cIn.parentNode) cIn.parentNode.removeChild(cIn); };
    cIn.addEventListener('animationend', done);
    setTimeout(done, 1100);
  } else if (came) {
    store('cls-nav', null);
  }
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) document.querySelectorAll('.curtain').forEach(function (c) { c.remove(); });
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    var m = /^([a-z]+\.html)(#.*)?$/.exec(href);
    if (!m) return;
    var here = location.pathname.split('/').pop() || 'index.html';
    if (m[1] === here) return;
    e.preventDefault();
    var label = 'กำลังไป: ' + (PAGE_NAMES[m[1]] || '');
    store('cls-nav', label);
    var c = makeCurtain(label);
    c.classList.add('closing');
    var go = function () { location.href = href; };
    c.addEventListener('animationend', go, { once: true });
    setTimeout(go, 550);
  });

  // ---------- 2. ประกายดาวตอนกดปุ่ม ----------
  document.addEventListener('pointerdown', function (e) {
    if (reduce) return;
    var t = e.target.closest && e.target.closest('.btn, .nav a, .menu-btn, .mini-strip a, a.sign, [data-zoom], .ch-btn, .filter-btn');
    if (!t) return;
    for (var i = 0; i < 6; i++) {
      var s = document.createElement('span');
      s.className = 'spark';
      var ang = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      var dist = 24 + Math.random() * 18;
      s.style.left = (e.clientX - 5) + 'px';
      s.style.top = (e.clientY - 5) + 'px';
      s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      document.body.appendChild(s);
      setTimeout(function (el) { el.remove(); }, 600, s);
    }
  });

  // ---------- 3. เมนูบนมือถือ ----------
  var btn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '✕ ปิดเมนู' : '☰ เมนู';
    });
  }

  // ---------- 4. นาฬิกาในเกม: 1 นาทีในเกม = 1 วินาทีจริง ----------
  var days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์'];
  var dayEl = document.querySelector('.clock .day');
  var timeEl = document.querySelector('.clock .time');
  var state = { d: 0, m: 8 * 60 + 15 };
  try {
    var saved = JSON.parse(store('cls-clock') || 'null');
    if (saved && typeof saved.d === 'number' && typeof saved.m === 'number') state = saved;
  } catch (e) {}
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function drawClock() {
    if (!dayEl || !timeEl) return;
    dayEl.textContent = days[state.d];
    timeEl.textContent = pad(Math.floor(state.m / 60)) + ':' + pad(state.m % 60);
  }
  drawClock();
  setInterval(function () {
    state.m += 1;
    if (state.m >= 16 * 60 + 30) { state.m = 6 * 60; state.d = (state.d + 1) % days.length; }
    drawClock();
    store('cls-clock', JSON.stringify(state));
  }, 1000);

  // ---------- 5. ปุ่มเลือกช่วงเวลาในเทรลเลอร์ (Trailer Chapters) ----------
  var trailerVideo = document.getElementById('trailer-video');
  var chapterBtns = document.querySelectorAll('.ch-btn[data-seek]');
  if (trailerVideo && chapterBtns.length) {
    chapterBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var sec = parseFloat(b.getAttribute('data-seek')) || 0;
        trailerVideo.currentTime = sec;
        trailerVideo.play().catch(function () {});
        chapterBtns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
      });
    });
    trailerVideo.addEventListener('timeupdate', function () {
      var t = trailerVideo.currentTime;
      var activeBtn = null;
      chapterBtns.forEach(function (b) {
        var sec = parseFloat(b.getAttribute('data-seek')) || 0;
        if (t >= sec) activeBtn = b;
      });
      chapterBtns.forEach(function (b) { b.classList.toggle('active', b === activeBtn); });
    });
  }

  // ---------- 6. ตัวกรองหมวดภาพในหน้า Gallery ----------
  var filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  var gallerySecs = document.querySelectorAll('[data-gallery-cat]');
  if (filterBtns.length && gallerySecs.length) {
    filterBtns.forEach(function (fb) {
      fb.addEventListener('click', function () {
        var cat = fb.getAttribute('data-filter');
        filterBtns.forEach(function (x) { x.classList.remove('active'); });
        fb.classList.add('active');
        gallerySecs.forEach(function (sec) {
          var sCat = sec.getAttribute('data-gallery-cat');
          sec.hidden = (cat !== 'all' && sCat !== cat);
        });
      });
    });
  }

  // ---------- 7. กล่องดูภาพขยาย (Lightbox) ----------
  var box = document.getElementById('lightbox');
  if (box) {
    var img = box.querySelector('img');
    var cap = box.querySelector('figcaption');
    var closeBtn = box.querySelector('.close');
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-zoom]'));
    var idx = 0, last = null;
    function show(i) {
      idx = (i + items.length) % items.length;
      var b = items[idx];
      img.src = b.getAttribute('data-zoom');
      img.alt = b.getAttribute('data-caption') || '';
      cap.textContent = (b.getAttribute('data-caption') || '') + '  (' + (idx + 1) + '/' + items.length + ')';
      var fig = box.querySelector('figure');
      fig.style.animation = 'none';
      void fig.offsetWidth;
      fig.style.animation = '';
    }
    items.forEach(function (b, i) {
      b.addEventListener('click', function () {
        last = b;
        show(i);
        box.hidden = false;
        closeBtn.focus();
      });
    });
    function close() { box.hidden = true; if (last) last.focus(); }
    closeBtn.addEventListener('click', close);
    box.querySelector('.prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    var sx = null;
    box.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }
})();
