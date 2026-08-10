/* Site behaviour: theme, nav, reveals, gallery rendering, lightbox. */
(function () {
  'use strict';

  var ART = 'assets/art/';
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var seriesById = {};
  if (typeof SERIES !== 'undefined') {
    SERIES.forEach(function (s) { seriesById[s.id] = s; });
  }

  /* --- Content hydration ---------------------------------------------------
     All copy lives in content.js (edited via the shemi-shoham-admin project).
     The static HTML keeps the same text as a no-JS fallback; here we overwrite
     it from CONTENT so edits show up without touching the pages. */

  (function hydrate() {
    if (typeof CONTENT === 'undefined') return;
    var T = CONTENT.texts || {};
    var page = document.body.dataset.page;

    // Set the first meaningful text node so inline SVGs (button arrows) survive.
    function put(sel, key, root) {
      if (!(key in T)) return;
      var el = (root || document).querySelector(sel);
      if (!el) return;
      for (var n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3 && n.nodeValue.trim()) { n.nodeValue = T[key]; return; }
      }
      el.insertBefore(document.createTextNode(T[key]), el.firstChild);
    }

    put('.brand__name', 'brandName');
    put('.brand__role', 'brandRole');
    put('.site-footer .kicker', 'footKicker');
    put('.site-footer__top h2', 'footTitle');
    put('.c-copy', 'footCopy');
    put('.c-credit', 'footCredit');

    if (page === 'home') {
      put('.hero .kicker', 'heroKicker');
      put('.hero h1 .thin', 'heroFirst');
      put('.hero h1 .gilded', 'heroLast');
      put('.hero__text .lede', 'heroLede');
      put('.hero__actions .btn--solid', 'heroBtn1');
      put('.hero__actions .btn--ghost', 'heroBtn2');
      put('#series .kicker', 'seriesKicker');
      put('#series h2', 'seriesTitle');
      put('#series .section__head p:not(.kicker)', 'seriesSub');
      put('#featured .kicker', 'featKicker');
      put('#featured h2', 'featTitle');
      put('#featured .section__head p:not(.kicker)', 'featSub');
      put('#codex-story .kicker', 'codexKicker');
      put('#codex-story h2', 'codexTitle');
      put('#codex-story .lede', 'codexLede');
      put('#codex-story .quote', 'codexQuote');
      put('#codex-story .btn', 'codexBtn');
      put('#about-teaser .kicker', 'teaserKicker');
      put('#about-teaser h2', 'teaserTitle');
      put('#about-teaser .lede', 'teaserLede');
      put('#about-teaser .lede + p', 'teaserPara');
      put('#about-teaser .btn', 'teaserBtn');

      var statsBox = $('[data-stats]');
      if (statsBox && CONTENT.stats) {
        statsBox.innerHTML = CONTENT.stats.map(function (s) {
          return '<div><b></b><span></span></div>';
        }).join('');
        $$('div', statsBox).forEach(function (d, i) {
          $('b', d).textContent = CONTENT.stats[i].n;
          $('span', d).textContent = CONTENT.stats[i].l;
        });
      }
    }

    if (page === 'gallery') {
      put('.page-head .kicker', 'galKicker');
      put('.page-head h1', 'galTitle');
      put('.page-head p:not(.kicker)', 'galSub');
    }

    if (page === 'about') {
      put('.page-head .kicker', 'aboutKicker');
      put('.page-head h1', 'aboutTitle');
      put('.page-head p:not(.kicker)', 'aboutSub');
      put('#bio .lede', 'bio1');
      put('#bio .lede + p', 'bio2');
      put('#bio .lede + p + p', 'bio3');
      put('#codex .kicker', 'acodexKicker');
      put('#codex h2', 'acodexTitle');
      put('#codex .lede', 'acodexLede');
      put('#codex .quote', 'acodexQuote');
      put('#codex .btn', 'acodexBtn');
      put('#awards .kicker', 'awardsKicker');
      put('#awards h2', 'awardsTitle');
      put('#exhibitions .kicker', 'exKicker');
      put('#exhibitions h2', 'exTitle');
      put('.c-solo-title', 'exSoloTitle');
      put('.c-group-title', 'exGroupTitle');
      put('#exhibitions .note', 'exNote');
      put('#contact .kicker', 'contactKicker');
      put('#contact h2', 'contactTitle');
      put('#contact .section__head p:not(.kicker)', 'contactSub');

      var awardsUl = $('[data-list="awards"]');
      if (awardsUl && CONTENT.awards) {
        awardsUl.innerHTML = '';
        CONTENT.awards.forEach(function (t) {
          var li = document.createElement('li');
          li.textContent = t;
          awardsUl.appendChild(li);
        });
      }

      ['exSolo', 'exGroup'].forEach(function (key) {
        var ol = $('[data-list="' + key + '"]');
        if (!ol || !CONTENT[key]) return;
        ol.innerHTML = '';
        CONTENT[key].forEach(function (row) {
          var li = document.createElement('li');
          var time = document.createElement('time');
          time.textContent = row.y;
          var span = document.createElement('span');
          span.textContent = row.t;
          li.appendChild(time);
          li.appendChild(span);
          ol.appendChild(li);
        });
      });

      var dl = $('.contact-card');
      if (dl) {
        var dds = $$('dd', dl);
        if (dds[0] && T.contactPhone) {
          var a = $('a', dds[0]) || dds[0];
          a.textContent = T.contactPhone;
          if (a.hasAttribute && a.hasAttribute('data-tel')) {
            var digits = T.contactPhone.replace(/\D/g, '');
            a.href = 'tel:' + (digits.charAt(0) === '0' ? '+972' + digits.slice(1) : digits);
          }
        }
        if (dds[1] && T.contactArea) dds[1].textContent = T.contactArea;
        if (dds[2] && T.contactFields) dds[2].textContent = T.contactFields;
      }
    }
  })();

  function countOf(id) {
    return WORKS.filter(function (w) { return w.s === id; }).length;
  }

  /* Cover for a series card; falls back to its first work (new galleries
     created in the editor start with no cover). */
  function coverOf(s) {
    if (s.cover) return ART + s.cover;
    var first = WORKS.find(function (w) { return w.s === s.id; });
    return first ? ART + first.s + '/' + first.f
      : 'data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><rect width="4" height="5" fill="#ead8bc"/></svg>');
  }

  /* --- Theme -------------------------------------------------------------- */

  var toggle = $('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('shemi-theme', next); } catch (e) { /* private mode */ }
      toggle.setAttribute('aria-label', next === 'dark' ? 'מעבר למצב בהיר' : 'מעבר למצב כהה');
    });
  }

  /* --- Header + mobile nav ------------------------------------------------ */

  var header = $('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var navToggle = $('.nav-toggle');
  var nav = $('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- Reveal on scroll ----------------------------------------------------
     Called at the very end, so cards rendered by JS are observed too. */

  function initReveals() {
    var reveals = $$('.reveal');
    if (!reveals.length) return;
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* --- Lightbox ----------------------------------------------------------- */

  var lb = $('.lightbox');
  var lbImg, lbTitle, lbSeries, lbCounter, lastFocus;
  var items = [];
  var index = 0;

  if (lb) {
    lbImg     = $('.lightbox__stage img', lb);
    lbTitle   = $('.lightbox__meta strong', lb);
    lbSeries  = $('.lightbox__meta span', lb);
    lbCounter = $('.lightbox__counter', lb);

    $('.lightbox__close', lb).addEventListener('click', closeLb);
    $('.lightbox__nav--prev', lb).addEventListener('click', function () { step(-1); });
    $('.lightbox__nav--next', lb).addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lightbox__stage')) closeLb();
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      // RTL: the left arrow advances, the right arrow goes back.
      if (e.key === 'ArrowLeft') step(1);
      if (e.key === 'ArrowRight') step(-1);
    });
  }

  function openLb(list, i) {
    if (!lb) return;
    items = list;
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add('is-open');
    lb.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    $('.lightbox__close', lb).focus();
  }

  function closeLb() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(delta) {
    show((index + delta + items.length) % items.length);
  }

  function show(i) {
    index = i;
    var it = items[i];
    lbImg.src = it.src;
    lbImg.alt = it.title;
    lbTitle.textContent = it.title;
    lbSeries.textContent = it.series;
    lbCounter.textContent = (i + 1) + ' / ' + items.length;
    // Warm the neighbours so paging feels instant.
    [items[(i + 1) % items.length], items[(i - 1 + items.length) % items.length]]
      .forEach(function (n) { var p = new Image(); p.src = n.src; });
  }

  function toItem(w) {
    return {
      src: ART + w.s + '/' + w.f,
      title: w.t,
      series: seriesById[w.s] ? seriesById[w.s].name : ''
    };
  }

  /* --- Home: micrography ring ---------------------------------------------
     RTL text on an SVG textPath collapses in Chromium, so we set each letter
     around the circle ourselves, counterclockwise — the way Hebrew runs on
     seals and coins. */

  var ring = $('.hero__ring');
  if (ring && ring.dataset.text) {
    var chars = Array.from(ring.dataset.text);
    var step = 360 / chars.length;
    var NS = 'http://www.w3.org/2000/svg';
    chars.forEach(function (ch, i) {
      if (ch === ' ') return;
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('transform', 'rotate(' + (-i * step) + ' 150 150) translate(150 26)');
      t.textContent = ch;
      ring.appendChild(t);
    });
  }

  /* --- Home: series cards ------------------------------------------------- */

  var seriesGrid = $('[data-series-grid]');
  if (seriesGrid) {
    seriesGrid.innerHTML = SERIES.map(function (s, n) {
      return '' +
        '<a class="series-card" href="gallery.html#' + s.id + '">' +
          '<span class="series-card__num" aria-hidden="true"><i>0' + (n + 1) + '</i></span>' +
          '<div class="series-card__img">' +
            '<img src="' + coverOf(s) + '" alt="' + s.name + '" loading="lazy" decoding="async">' +
          '</div>' +
          '<div class="series-card__body">' +
            '<h3>' + s.name + '</h3>' +
            '<span class="series-card__count">' + countOf(s.id) + ' עבודות</span>' +
            '<p class="series-card__blurb">' + s.blurb + '</p>' +
          '</div>' +
        '</a>';
    }).join('');
  }

  /* --- Home: featured strip ----------------------------------------------- */

  var strip = $('[data-strip]');
  if (strip) {
    var picks = [
      'judaica/jerusalem.jpg', 'paintings/yemenitbride.jpg', 'aleppo/simhattora.jpg',
      'song-of-songs/nitsanim.jpg', 'watercolors/yafo.jpg', 'paintings/kabaret.jpg',
      'aleppo/mekoubal.jpg', 'watercolors/treeplayers.JPG', 'paintings/tawas.jpg',
      'judaica/eshethail.jpg', 'song-of-songs/ketempaz.jpg', 'paintings/tiberias.jpg'
    ];
    var featured = picks.map(function (p) {
      var parts = p.split('/');
      return WORKS.find(function (w) { return w.s === parts[0] && w.f === parts[1]; });
    }).filter(Boolean);

    strip.innerHTML = featured.map(function (w, i) {
      return '' +
        '<figure data-i="' + i + '" tabindex="0" role="button" aria-label="הגדלת ' + w.t + '">' +
          '<span class="frame">' +
            '<img src="' + ART + w.s + '/' + w.f + '" alt="' + w.t + '" loading="lazy" decoding="async">' +
          '</span>' +
          '<figcaption>' + w.t +
            '<small>' + (seriesById[w.s] ? seriesById[w.s].short : '') + '</small>' +
          '</figcaption>' +
        '</figure>';
    }).join('');

    var stripItems = featured.map(toItem);
    var openFromStrip = function (e) {
      var fig = e.target.closest('figure');
      if (!fig) return;
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openLb(stripItems, Number(fig.dataset.i));
    };
    strip.addEventListener('click', openFromStrip);
    strip.addEventListener('keydown', openFromStrip);
  }

  /* --- Gallery ------------------------------------------------------------ */

  var grid = $('[data-grid]');
  if (grid) {
    var filterBar = $('[data-filters]');
    var empty = $('[data-empty]');
    var active = 'all';

    filterBar.innerHTML = [{ id: 'all', name: 'הכול' }].concat(SERIES).map(function (s) {
      var n = s.id === 'all' ? WORKS.length : countOf(s.id);
      return '<button class="filter" type="button" data-filter="' + s.id + '" aria-pressed="' +
             (s.id === 'all') + '">' + (s.short || s.name) + '<b>' + n + '</b></button>';
    }).join('');

    grid.innerHTML = WORKS.map(function (w, i) {
      return '' +
        '<button class="work" type="button" data-i="' + i + '" data-s="' + w.s + '" aria-label="הגדלת ' + w.t + '">' +
          '<img src="' + ART + w.s + '/' + w.f + '" alt="' + w.t + '" width="' + w.w + '" height="' + w.h + '" loading="lazy" decoding="async">' +
          '<span class="work__cap">' +
            '<strong>' + w.t + '</strong>' +
            '<span>' + (seriesById[w.s] ? seriesById[w.s].name : '') + '</span>' +
          '</span>' +
        '</button>';
    }).join('');

    var cards = $$('.work', grid);

    var apply = function (id, push) {
      active = id;
      var shown = 0;
      cards.forEach(function (c) {
        var hit = id === 'all' || c.dataset.s === id;
        c.classList.toggle('is-hidden', !hit);
        if (hit) shown++;
      });
      $$('.filter', filterBar).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.filter === id));
      });
      empty.hidden = shown > 0;
      if (push) {
        history.replaceState(null, '', id === 'all' ? location.pathname : '#' + id);
      }
    };

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (btn) apply(btn.dataset.filter, true);
    });

    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.work');
      if (!card) return;
      var visible = WORKS.filter(function (w) { return active === 'all' || w.s === active; });
      var w = WORKS[Number(card.dataset.i)];
      openLb(visible.map(toItem), visible.indexOf(w));
    });

    var initial = location.hash.replace('#', '');
    apply(seriesById[initial] ? initial : 'all', false);
  }

  initReveals();
})();
