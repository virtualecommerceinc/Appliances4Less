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
    // failsafe: after the animation window, force the final state inline in case the
    // 0->1 transition never advances (observed in some embedded/preview engines)
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
  // fallback: run a rect-based check on load/scroll/resize and once shortly after init
  window.addEventListener('scroll', revealInView, { passive: true });
  window.addEventListener('resize', revealInView);
  window.addEventListener('load', revealInView);
  revealInView();
  setTimeout(revealInView, 400);
  // ultimate safety net: if neither IO nor scroll reveal ran (broken/headless engines),
  // force everything visible so content is never trapped at opacity 0
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
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) closeChat(); });

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
