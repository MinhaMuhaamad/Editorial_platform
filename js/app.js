/**
 * Lumina — Smart Reader Experience
 * Vanilla JS: theme persistence, reading time, scroll progress.
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'lumina-theme';
  const WORDS_PER_MINUTE = 200;

  

  function getStoredTheme() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light' || stored === 'contrast') return stored;
    } catch (_) {}
    return null;
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (_) {}
  }

  function applyThemeFromStorage() {
    const theme = getStoredTheme();
    const themeIds = ['theme-dark', 'theme-light', 'theme-contrast'];
    const id = theme ? 'theme-' + theme : 'theme-light';
    themeIds.forEach(function (tid) {
      const radio = document.getElementById(tid);
      if (radio) radio.checked = (tid === id);
    });
  }

  function bindThemeSwitcher() {
    ['theme-dark', 'theme-light', 'theme-contrast'].forEach(function (id) {
      const radio = document.getElementById(id);
      if (!radio) return;
      radio.addEventListener('change', function () {
        const theme = id.replace('theme-', '');
        setStoredTheme(theme);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Time-to-read: count words in article body, inject into header
  // ---------------------------------------------------------------------------

  function getTextFromNode(node) {
    if (!node) return '';
    var text = '';
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    var n;
    while ((n = walker.nextNode())) text += n.textContent;
    return text;
  }

  function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function calculateReadingTime(wordCount) {
    if (wordCount <= 0) return 1;
    return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  }

  function injectReadingTime() {
    var articleBody = document.querySelector('.article-body');
    var headerInner = document.querySelector('.article-header__inner');
    if (!articleBody || !headerInner) return;

    var text = getTextFromNode(articleBody);
    var wordCount = countWords(text);
    var minutes = calculateReadingTime(wordCount);
    var label = minutes === 1 ? '1 min read' : minutes + ' min read';

    var existing = headerInner.querySelector('.article-header__read-time');
    if (existing) {
      existing.textContent = label;
      return;
    }

    var el = document.createElement('p');
    el.className = 'article-header__read-time';
    el.setAttribute('aria-label', 'Estimated reading time');
    el.textContent = label;
    headerInner.appendChild(el);
  }

  // ---------------------------------------------------------------------------
  // Reading progress bar: smooth fill based on scroll
  // ---------------------------------------------------------------------------

  function createProgressBar() {
    var bar = document.createElement('div');
    bar.className = 'reading-progress-bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Reading progress');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', '0');
    var fill = document.createElement('div');
    fill.className = 'reading-progress-bar__fill';
    bar.appendChild(fill);
    var wrapper = document.querySelector('.theme-wrapper');
    if (wrapper) wrapper.insertBefore(bar, wrapper.firstChild);
    else document.body.appendChild(bar);
    return { bar: bar, fill: fill };
  }

  function getScrollProgress() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) return 0;
    return Math.min(1, Math.max(0, scrollTop / docHeight));
  }

  function updateProgressBar(fillEl, barEl) {
    var progress = getScrollProgress();
    var pct = Math.round(progress * 100);
    if (fillEl) fillEl.style.width = pct + '%';
    if (barEl) {
      barEl.setAttribute('aria-valuenow', String(pct));
    }
  }

  function initReadingProgress() {
    if (!document.querySelector('.article-page')) return;

    var progress = createProgressBar();
    var fill = progress.fill;
    var bar = progress.bar;
    var ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateProgressBar(fill, bar);
          ticking = false;
        });
        ticking = true;
      }
    }

    updateProgressBar(fill, bar);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---------------------------------------------------------------------------
  // Init: run when DOM is ready
  // ---------------------------------------------------------------------------

  function init() {
    applyThemeFromStorage();
    bindThemeSwitcher();

    if (document.querySelector('.article-body')) {
      injectReadingTime();
    }
    if (document.querySelector('.article-page')) {
      initReadingProgress();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
