(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Theme toggle ─────────────────────────────────────────
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  document.querySelector('.theme-toggle').addEventListener('click', function () {
    var current = root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
    var next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // ── Scroll progress ──────────────────────────────────────
  var progress = document.querySelector('.progress');
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Card glow ────────────────────────────────────────────
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--x', (e.clientX - r.left) + 'px');
      card.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
  });

  // ── Reveal on scroll (staggered within each section) ─────
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var parents = new Map();
    reveals.forEach(function (el) {
      var n = parents.get(el.parentElement) || 0;
      el.style.setProperty('--d', Math.min(n, 6) * 0.07 + 's');
      parents.set(el.parentElement, n + 1);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ── Nav: active section + sliding pill ───────────────────
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var pill = document.querySelector('.nav-pill');
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function movePill(link) {
    if (!link) { pill.style.opacity = 0; return; }
    pill.style.opacity = 1;
    pill.style.width = link.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + link.offsetLeft + 'px)';
  }

  function updateActive() {
    var line = window.innerHeight * 0.35;
    var active = null;
    sections.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top <= line) active = navLinks[i];
    });
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a === active); });
    movePill(active);
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();

  // ── Filter chips ─────────────────────────────────────────
  document.querySelectorAll('.chips').forEach(function (group) {
    var target = document.querySelector(group.dataset.filterTarget);
    group.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      group.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      var f = chip.dataset.filter;
      target.querySelectorAll('[data-type]').forEach(function (item) {
        item.hidden = f !== 'all' && item.dataset.type !== f;
      });
    });
  });

  // ── Abstract toggles ─────────────────────────────────────
  document.querySelectorAll('.abstract-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = btn.closest('.paper-body').querySelector('.abstract');
      var open = panel.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
    });
  });

  // ── CV preview (iframe loads only on first open) ─────────
  var cvBtn = document.querySelector('.cv-toggle');
  var cvFrame = document.querySelector('.cv-frame');
  if (cvBtn && cvFrame) {
    cvBtn.addEventListener('click', function () {
      if (!cvFrame.firstChild) {
        var iframe = document.createElement('iframe');
        iframe.src = cvFrame.dataset.src;
        iframe.title = 'CV preview';
        iframe.loading = 'lazy';
        cvFrame.appendChild(iframe);
      }
      var open = cvFrame.classList.toggle('is-open');
      cvBtn.setAttribute('aria-expanded', open);
      cvBtn.textContent = open ? 'Hide preview' : 'Preview';
    });
  }

  // ── Copy email ───────────────────────────────────────────
  var toast = document.querySelector('.toast');
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-shown'); }, 2200);
  }
  document.querySelectorAll('.copy-email').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var email = btn.dataset.email;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(
          function () { showToast('Email copied to clipboard'); },
          function () { window.location.href = 'mailto:' + email; }
        );
      } else {
        window.location.href = 'mailto:' + email;
      }
    });
  });

  // ── Local clock ──────────────────────────────────────────
  var clock = document.querySelector('.clock');
  if (clock) {
    var out = clock.querySelector('.clock-time');
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-US', { timeZone: clock.dataset.tz, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    } catch (e) { fmt = null; }
    if (fmt) {
      var tick = function () { out.textContent = fmt.format(new Date()); };
      tick();
      setInterval(tick, 15000);
    } else {
      clock.hidden = true;
    }
  }
})();
