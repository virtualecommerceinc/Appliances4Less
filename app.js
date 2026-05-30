/* =====================================================================
   CNY Appliances 4 Less — interactions + A4L concierge
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- nav scroll state ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile burger -> jump to visit / open menu fallback ---------- */
  var burger = document.getElementById('burger');
  if (burger) {
    burger.addEventListener('click', function () {
      document.getElementById('visit').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- highlight today's hours row ---------- */
  (function () {
    var day = new Date().getDay(); // 0 = Sun
    var sel = day === 0 ? '[data-day="sun"]' : '[data-day="mon-sat"]';
    var row = document.querySelector('.hours-card ' + sel);
    if (row) row.classList.add('today');
  })();

  /* ---------- scroll reveal (IO + rect fallback + inline failsafe so content is never stuck hidden) ---------- */
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  var ioFired = false;
  function markIn(el) {
    el.classList.add('in');
    setTimeout(function () {
      if (getComputedStyle(el).opacity !== '1') {
        el.style.transition = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    }, 1400);
  }
  function revealInView() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = reveals.length - 1; i >= 0; i--) {
      var el = reveals[i];
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92) {
        markIn(el);
        reveals.splice(i, 1);
      }
    }
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      ioFired = true;
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          markIn(e.target);
          io.unobserve(e.target);
          var k = reveals.indexOf(e.target);
          if (k !== -1) reveals.splice(k, 1);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.slice().forEach(function (r) { io.observe(r); });
  }
  window.addEventListener('scroll', revealInView, { passive: true });
  window.addEventListener('resize', revealInView);
  window.addEventListener('load', revealInView);
  revealInView();
  setTimeout(revealInView, 400);
  setTimeout(function () {
    if (ioFired) return;
    reveals.slice().forEach(function (el) {
      el.classList.add('in');
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    reveals.length = 0;
  }, 2600);

  /* ---------- hero parallax (subtle) ---------- */
  var par = document.querySelectorAll('[data-parallax]');
  var ticking = false;
  function parallax() {
    var sy = window.scrollY;
    par.forEach(function (el) {
      var f = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      el.style.transform = 'translate3d(0,' + (-sy * f) + 'px,0)';
    });
    ticking = false;
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && par.length) {
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(parallax); ticking = true; }
    }, { passive: true });
  }

  /* =====================================================================
     LOCATION GALLERIES — editorial lead + thumb rail + lightbox
     ===================================================================== */
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var Lightbox = (function () {
    var el = document.getElementById('lightbox');
    if (!el) return { open: function () {}, close: function () {}, sync: function () {}, get openFor() { return null; } };
    var img = el.querySelector('.lightbox__img');
    var cap = el.querySelector('.lightbox__cap');
    var counter = el.querySelector('.lightbox__counter');
    var closeBtn = el.querySelector('.lightbox__close');
    var prevBtn = el.querySelector('.lightbox__nav--prev');
    var nextBtn = el.querySelector('.lightbox__nav--next');
    var backdrop = el.querySelector('.lightbox__backdrop');
    var openFor = null;
    var prevFocus = null;

    function pad(n) { return String(n).length < 2 ? '0' + n : String(n); }

    function sync() {
      if (!openFor) return;
      var p = openFor.photos[openFor.idx];
      if (!p) return;
      img.src = p.src;
      img.alt = p.alt;
      cap.textContent = p.cap;
      counter.textContent = pad(openFor.idx + 1) + ' / ' + pad(openFor.photos.length);
    }
    function open(inst) {
      openFor = inst;
      prevFocus = document.activeElement;
      el.classList.add('open');
      el.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      sync();
      setTimeout(function () { if (closeBtn) closeBtn.focus(); }, 80);
    }
    function close() {
      el.classList.remove('open');
      el.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      openFor = null;
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    }
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    if (img) img.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', function () { if (openFor) openFor.select(openFor.idx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (openFor) openFor.select(openFor.idx + 1); });

    var lbsx = 0, lbsy = 0, lbtrack = false;
    el.addEventListener('touchstart', function (e) {
      if (!openFor || e.touches.length !== 1) return;
      lbsx = e.touches[0].clientX; lbsy = e.touches[0].clientY; lbtrack = true;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (!lbtrack || !openFor) return; lbtrack = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - lbsx, dy = t.clientY - lbsy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) openFor.select(openFor.idx + 1); else openFor.select(openFor.idx - 1);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!el.classList.contains('open')) return;
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === 'ArrowLeft' && openFor) { e.preventDefault(); openFor.select(openFor.idx - 1); }
      else if (e.key === 'ArrowRight' && openFor) { e.preventDefault(); openFor.select(openFor.idx + 1); }
    }, true);
    return { open: open, close: close, sync: sync, get openFor() { return openFor; } };
  })();

  [].slice.call(document.querySelectorAll('.locgallery')).forEach(function (root) {
    var leadA = root.querySelector('.locgallery__lead--a');
    var leadB = root.querySelector('.locgallery__lead--b');
    var cap = root.querySelector('.locgallery__cap');
    var counterCur = root.querySelector('.locgallery__counter .cur');
    var counterTot = root.querySelector('.locgallery__counter .tot');
    var thumbs = [].slice.call(root.querySelectorAll('.locgallery__thumb'));
    var prevBtn = root.querySelector('.locgallery__nav--prev');
    var nextBtn = root.querySelector('.locgallery__nav--next');
    var expandBtn = root.querySelector('.locgallery__expand');
    var stage = root.querySelector('.locgallery__stage');
    var rail = root.querySelector('.locgallery__rail');
    if (!leadA || !leadB || !thumbs.length || !stage) return;

    var photos = thumbs.map(function (t) {
      return {
        src: t.getAttribute('data-src') || '',
        alt: t.getAttribute('data-alt') || '',
        cap: t.getAttribute('data-cap') || ''
      };
    });
    var idx = 0;
    var visibleLayer = 'a';
    if (counterTot) counterTot.textContent = String(photos.length).length < 2 ? '0' + photos.length : String(photos.length);

    function pad(n) { return String(n).length < 2 ? '0' + n : String(n); }
    function mod(n, m) { return ((n % m) + m) % m; }
    function preload(i) {
      if (i < 0 || i >= photos.length) return;
      var im = new Image(); im.src = photos[i].src;
    }

    function select(target) {
      var i = mod(target, photos.length);
      if (i === idx) {
        if (Lightbox.openFor === inst) Lightbox.sync();
        return;
      }
      var p = photos[i];
      var incoming = visibleLayer === 'a' ? leadB : leadA;
      var outgoing = visibleLayer === 'a' ? leadA : leadB;

      var pre = new Image();
      pre.onload = function () {
        incoming.src = p.src;
        incoming.alt = p.alt;
        incoming.offsetWidth;
        incoming.classList.add('is-visible');
        outgoing.classList.remove('is-visible');
        visibleLayer = visibleLayer === 'a' ? 'b' : 'a';
      };
      pre.onerror = function () {
        incoming.src = p.src;
        incoming.alt = p.alt;
        incoming.classList.add('is-visible');
        outgoing.classList.remove('is-visible');
        visibleLayer = visibleLayer === 'a' ? 'b' : 'a';
      };
      pre.src = p.src;

      if (cap) cap.textContent = p.cap;
      if (counterCur) counterCur.textContent = pad(i + 1);

      thumbs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) t.classList.add('is-active'); else t.classList.remove('is-active');
      });

      idx = i;
      preload(mod(i + 1, photos.length));
      preload(mod(i - 1, photos.length));

      var active = thumbs[i];
      if (active && rail) {
        var rRect = rail.getBoundingClientRect();
        var aRect = active.getBoundingClientRect();
        if (aRect.left < rRect.left + 8 || aRect.right > rRect.right - 8) {
          var t = active.offsetLeft - (rail.clientWidth - active.clientWidth) / 2;
          if (typeof rail.scrollTo === 'function') {
            rail.scrollTo({ left: t, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
          } else {
            rail.scrollLeft = t;
          }
        }
      }

      if (Lightbox.openFor === inst) Lightbox.sync();
    }

    var inst = { root: root, photos: photos, get idx() { return idx; }, select: select };

    thumbs.forEach(function (t, j) { t.addEventListener('click', function () { select(j); }); });
    if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); select(idx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); select(idx + 1); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(idx - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); select(idx + 1); }
    });

    var sx = 0, sy = 0, tracking = false;
    stage.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (!tracking) return; tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) select(idx + 1); else select(idx - 1);
      }
    });

    function openLightbox(e) {
      if (e && e.target && e.target.closest && e.target.closest('.locgallery__nav,.locgallery__expand')) return;
      Lightbox.open(inst);
    }
    stage.addEventListener('click', openLightbox);
    if (expandBtn) expandBtn.addEventListener('click', function (e) { e.stopPropagation(); Lightbox.open(inst); });

    if (photos.length > 1) { preload(1); preload(photos.length - 1); }
  });

  /* =====================================================================
     DELIVERY RADIUS MAP — Leaflet + CartoDB Dark Matter
     ---------------------------------------------------------------------
     A real geographic map of central NY with a gold ~55-mile (88.5 km)
     radius circle drawn around the Erie Blvd showroom. Crimson star marks
     the showroom; smaller gold stars mark common lake-camp / town landmarks
     inside the radius. Default state: pure graphic (no zoom, no drag).
     On touch viewports a "Tap to explore" chip unlocks interaction.
     If the Leaflet CDN fails, an inline fallback panel still says
     "~1 hour delivery radius from Syracuse" so the section never blanks.
     ===================================================================== */
  function whenLeafletReady(cb, opts) {
    opts = opts || {};
    var deadline = Date.now() + (opts.timeoutMs || 5000);
    (function loop() {
      if (typeof window.L !== 'undefined') { cb(true); return; }
      if (Date.now() > deadline) { cb(false); return; }
      setTimeout(loop, 80);
    })();
  }

  function initDeliveryMap() {
    var wrap = document.getElementById('delivery-map-wrap');
    var mapEl = document.getElementById('delivery-map');
    var fallback = document.getElementById('delivery-map-fallback');
    var toggle = document.getElementById('delivery-map-toggle');
    if (!mapEl || !wrap) return;

    whenLeafletReady(function (ok) {
      if (!ok || typeof window.L === 'undefined') {
        wrap.classList.add('is-fallback');
        if (fallback) fallback.hidden = false;
        return;
      }

      var L = window.L;
      // 2760 Erie Blvd E, Syracuse NY 13224 — approximate lat/lon (Eastwood).
      var SHOWROOM = [43.0517, -76.1213];
      // ~55 mi = ~88.5 km — matches the in-copy "about an hour out from Syracuse" claim.
      var RADIUS_M = 88500;

      var map = L.map(mapEl, {
        center: SHOWROOM,
        zoom: 9,
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        dragging: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        tap: false,
        attributionControl: false,
        zoomSnap: 0.5,
        zoomDelta: 0.5
      });

      L.control.attribution({ prefix: false, position: 'bottomright' })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>')
        .addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
        detectRetina: true,
        crossOrigin: true
      }).addTo(map);

      // Gold radius circle
      var ring = L.circle(SHOWROOM, {
        radius: RADIUS_M,
        color: '#e2c474',
        weight: 2.2,
        opacity: 0.9,
        fillColor: '#c4a052',
        fillOpacity: 0.08,
        interactive: false
      }).addTo(map);

      // Fit the visible area to the circle bounds (so users see the whole radius).
      try {
        map.fitBounds(ring.getBounds(), { padding: [12, 12], animate: false });
      } catch (e) {
        map.setView(SHOWROOM, 8);
      }

      // Brand-styled star markers. SVG path is a 5-point star.
      function starSvg(size, fill, stroke, glow) {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '"' +
               ' style="overflow:visible">' +
               (glow ? '<defs><filter id="g' + size + '" x="-50%" y="-50%" width="200%" height="200%">' +
                 '<feGaussianBlur stdDeviation="1.4"/></filter></defs>' : '') +
               '<path d="M12 2 14.5 9 22 9 16 13.5 18 21 12 16.5 6 21 8 13.5 2 9 9.5 9z"' +
               ' fill="' + fill + '" stroke="' + stroke + '" stroke-width="1" stroke-linejoin="round"' +
               (glow ? ' filter="url(#g' + size + ')"' : '') + '/></svg>';
      }

      var showroomIcon = L.divIcon({
        className: 'delivery-marker delivery-marker--showroom',
        html: starSvg(30, '#c4283c', '#f7f2e8', false),
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      L.marker(SHOWROOM, { icon: showroomIcon, title: 'A4L Showroom — 2760 Erie Blvd E', interactive: false, keyboard: false }).addTo(map);

      var landmarkIcon = L.divIcon({
        className: 'delivery-marker delivery-marker--landmark',
        html: starSvg(16, '#c4a052', '#e2c474', false),
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      var landmarks = [
        { coords: [43.1854, -75.9069], name: 'Oneida Lake — south shore camps' },
        { coords: [42.9301, -76.4291], name: 'Skaneateles' },
        { coords: [42.9290, -75.8554], name: 'Cazenovia' },
        { coords: [42.6010, -76.1804], name: 'Cortland' }
      ];
      landmarks.forEach(function (lm) {
        L.marker(lm.coords, { icon: landmarkIcon, title: lm.name, interactive: false, keyboard: false }).addTo(map);
      });

      // Mobile "Tap to explore" toggle: unlocks drag/zoom and drops a zoom control.
      var unlocked = false;
      var zoomCtrl = null;
      function unlock() {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
        map.doubleClickZoom.enable();
        map.touchZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        if (!zoomCtrl) {
          zoomCtrl = L.control.zoom({ position: 'topright' });
          zoomCtrl.addTo(map);
        }
        if (toggle) {
          toggle.classList.add('is-on');
          toggle.setAttribute('aria-pressed', 'true');
          toggle.textContent = 'Lock view';
        }
        unlocked = true;
      }
      function lock() {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
        map.touchZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (zoomCtrl) { zoomCtrl.remove(); zoomCtrl = null; }
        if (toggle) {
          toggle.classList.remove('is-on');
          toggle.setAttribute('aria-pressed', 'false');
          toggle.textContent = 'Tap to explore';
        }
        try { map.fitBounds(ring.getBounds(), { padding: [12, 12], animate: true }); } catch (e) {}
        unlocked = false;
      }
      if (toggle) {
        toggle.addEventListener('click', function (e) {
          e.preventDefault();
          if (unlocked) lock(); else unlock();
        });
      }

      // Recompute the fit when the section first comes into view AND on resize —
      // Leaflet measures the container at init, and a hidden / not-yet-laid-out
      // container yields a degenerate viewport. invalidateSize() repairs it.
      function fix() {
        map.invalidateSize(false);
        if (!unlocked) {
          try { map.fitBounds(ring.getBounds(), { padding: [12, 12], animate: false }); } catch (e) {}
        }
      }
      window.addEventListener('load', fix);
      window.addEventListener('resize', function () {
        if (window._a4lMapResizeT) clearTimeout(window._a4lMapResizeT);
        window._a4lMapResizeT = setTimeout(fix, 180);
      });
      if ('IntersectionObserver' in window) {
        var mio = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { fix(); mio.unobserve(en.target); }
          });
        }, { threshold: 0.05 });
        mio.observe(wrap);
      }
      // One more pass shortly after init to catch any late layout shift.
      setTimeout(fix, 350);
    }, { timeoutMs: 5500 });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeliveryMap);
  } else {
    initDeliveryMap();
  }

  /* =====================================================================
     A4L CONCIERGE CHATBOT
     ===================================================================== */
  var PHONE = '<a href="tel:+13158889998">(315)&nbsp;888-9998</a>';

  var KB = [
    {
      keys: ['deliver', 'delivery', 'how far', 'far', 'haul', 'pick up', 'bring', 'area', 'camp', 'lake', 'travel'],
      a: 'Yes — we deliver and haul away your old appliance for a small extra fee. We travel about an hour out, including camps on the lake. <b>Same-day delivery is often available</b> — call or text ' + PHONE + ' and we\'ll line it up.'
    },
    {
      keys: ['hour', 'open', 'close', 'time', 'today', 'when'],
      a: 'We\'re open <b>Mon–Sat 10am–7pm</b> and <b>Sun 10am–6pm</b> at 2760 Erie Blvd E, Syracuse. Come on by — no appointment needed.'
    },
    {
      keys: ['black stainless', 'gas stove', 'gas range', 'electric range', 'stove', 'range', 'oven', 'model'],
      a: 'We rotate stock and often carry <b>black-stainless ranges</b> in both gas and electric. Call or text ' + PHONE + ' and we\'ll check exactly what\'s on the floor today.'
    },
    {
      keys: ['scratch', 'dent', 'blemish', 'open box', 'open-box', 'damaged', 'cosmetic'],
      a: '<b>Scratch &amp; dent</b> means brand-new, never-used units with a minor cosmetic blemish — usually a small dent or scratch on the side or back. Fully functional, often with factory warranty, at a big discount.'
    },
    {
      keys: ['wholesale', 'bulk', 'business', 'contractor', 'landlord', 'canal'],
      a: 'Yes — we sell <b>wholesale out of our Canal St warehouse</b> (835 Canal St) plus retail at the Erie Blvd showroom. Call ' + PHONE + ' and we\'ll talk volume pricing.'
    },
    {
      keys: ['warranty', 'guarantee', 'guaranteed', 'return', 'protect'],
      a: 'Many of our new units carry the <b>manufacturer\'s warranty</b> — and everything we sell is guaranteed to save you money. Ask us about the specific model and we\'ll give you the details.'
    },
    {
      keys: ['pay', 'payment', 'credit', 'card', 'apple pay', 'finance', 'cash', 'debit'],
      a: 'We accept <b>major credit cards, Apple Pay, and more</b>. Stop in or call ' + PHONE + ' if you have a specific question about payment.'
    },
    {
      keys: ['french', 'water', 'ice', 'dispenser', 'fridge', 'refrigerator', 'side by side', 'side-by-side', 'freezer'],
      a: 'We regularly stock <b>French-door refrigerators with water and ice dispensers</b>, plus side-by-sides and freezers. Call or text ' + PHONE + ' for today\'s selection and pricing.'
    },
    {
      keys: ['washer', 'dryer', 'laundry', 'wash'],
      a: 'We carry washers, dryers and matched <b>laundry sets</b> — both new and scratch &amp; dent. Call or text ' + PHONE + ' and we\'ll tell you what\'s in stock.'
    },
    {
      keys: ['dishwasher'],
      a: 'Yes — we stock <b>stainless-tub dishwashers</b>, new and scratch &amp; dent. Call or text ' + PHONE + ' for today\'s models and pricing.'
    },
    {
      keys: ['where', 'address', 'location', 'directions', 'showroom', 'store', 'erie'],
      a: 'Our showroom is at <b>2760 Erie Blvd E, Syracuse, NY 13224</b>, with the wholesale warehouse at 835 Canal St. Open Mon–Sat 10–7, Sun 10–6.'
    },
    {
      keys: ['price', 'deal', 'cheap', 'cost', 'save', 'discount', 'best', 'floor', 'available', 'in stock', 'inventory'],
      a: 'Our stock rotates fast and the deals are real — typically <b>40%+ off retail</b>. For today\'s exact selection and prices, call or text ' + PHONE + ' or stop by the showroom.'
    },
    {
      keys: ['hello', 'hi', 'hey', 'help', 'thanks', 'thank'],
      a: 'Happy to help! Ask me about delivery, hours, scratch &amp; dent savings, or what\'s in stock — or call/text us at ' + PHONE + '.'
    }
  ];

  var FALLBACK = 'Great question — call or text us at ' + PHONE + ' or stop by 2760 Erie Blvd E and we\'ll take care of you.';

  var CHIPS = [
    'Do you deliver to my area?',
    'What are your hours?',
    'What does scratch & dent mean?',
    'Do you have French-door fridges?'
  ];

  function answerFor(text) {
    var t = (' ' + text + ' ').toLowerCase();
    var best = null, bestScore = 0;
    KB.forEach(function (entry) {
      var score = 0;
      entry.keys.forEach(function (k) { if (t.indexOf(k) !== -1) score += k.length; });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    return best ? best.a : FALLBACK;
  }

  var launcher = document.getElementById('chatLauncher');
  var panel = document.getElementById('chatPanel');
  var closeBtn = document.getElementById('chatClose');
  var body = document.getElementById('chatBody');
  var chipsEl = document.getElementById('chatChips');
  var form = document.getElementById('chatForm');
  var input = document.getElementById('chatText');
  var greeted = false;

  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function addMsg(html, who) {
    var d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = html;
    body.appendChild(d);
    scrollDown();
    return d;
  }

  function showTyping() {
    var t = document.createElement('div');
    t.className = 'chat-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(t);
    scrollDown();
    return t;
  }

  function botReply(text) {
    var typing = showTyping();
    var delay = 520 + Math.min(900, text.length * 6);
    setTimeout(function () {
      typing.remove();
      addMsg(answerFor(text), 'bot');
    }, delay);
  }

  function renderChips() {
    chipsEl.innerHTML = '';
    CHIPS.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chat-chip';
      b.type = 'button';
      b.textContent = c;
      b.addEventListener('click', function () { send(c); });
      chipsEl.appendChild(b);
    });
  }

  function send(text) {
    text = (text || '').trim();
    if (!text) return;
    addMsg(text.replace(/&/g, '&amp;').replace(/</g, '&lt;'), 'user');
    input.value = '';
    botReply(text);
  }

  function greet() {
    if (greeted) return;
    greeted = true;
    setTimeout(function () {
      addMsg('Hey there — welcome to <b>Appliances 4 Less</b>! 👋 I\'m the A4L concierge. Ask me anything about delivery, hours, scratch &amp; dent savings, or what\'s in stock.', 'bot');
      renderChips();
    }, 350);
  }

  function openChat() {
    panel.classList.add('open');
    launcher.classList.add('open');
    greet();
    setTimeout(function () { input.focus(); }, 480);
  }
  function closeChat() {
    panel.classList.remove('open');
    launcher.classList.remove('open');
  }

  if (launcher) launcher.addEventListener('click', openChat);
  if (closeBtn) closeBtn.addEventListener('click', closeChat);
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) closeChat();
  });

  /* ---------- "Ask about this" buttons -> open chat prefilled ---------- */
  document.querySelectorAll('[data-ask]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var q = btn.getAttribute('data-ask');
      var wasGreeted = greeted;
      openChat();
      setTimeout(function () { send(q); }, wasGreeted ? 220 : 1100);
    });
  });
})();
