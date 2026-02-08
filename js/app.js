/**
 * Lumina — Smart Reader Experience
 * Vanilla JS: theme persistence, reading time, scroll progress.
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'lumina-theme';
  const WORDS_PER_MINUTE = 200;

  // =========================================================================
  // THEME PERSISTENCE ENGINE
  // =========================================================================

  function getStoredTheme() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light' || stored === 'contrast') {
        return stored;
      }
    } catch (error) {
      console.warn('localStorage access failed:', error);
    }
    return null;
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('localStorage write failed:', error);
    }
  }

  function applyThemeFromStorage() {
    const theme = getStoredTheme();
    const themeIds = ['theme-dark', 'theme-light', 'theme-contrast'];
    const targetId = theme ? 'theme-' + theme : 'theme-light';
    
    themeIds.forEach(function (tid) {
      const radio = document.getElementById(tid);
      if (radio) {
        radio.checked = (tid === targetId);
      }
    });
  }

  function bindThemeSwitcher() {
    ['theme-dark', 'theme-light', 'theme-contrast'].forEach(function (id) {
      const radio = document.getElementById(id);
      if (!radio) return;
      
      radio.addEventListener('change', function () {
        if (this.checked) {
          const theme = id.replace('theme-', '');
          setStoredTheme(theme);
        }
      });
    });
  }

  // =========================================================================
  // TIME-TO-READ CALCULATOR
  // =========================================================================

  function getTextFromNode(node) {
    if (!node) return '';
    
    var text = '';
    var walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    var textNode;
    while ((textNode = walker.nextNode())) {
      text += textNode.textContent;
    }
    
    return text;
  }

  function countWords(text) {
    return text
      .trim()
      .split(/\s+/)
      .filter(function(word) { return word.length > 0; })
      .length;
  }

  function calculateReadingTime(wordCount) {
    if (wordCount <= 0) return 1;
    return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  }

  function injectReadingTime() {
    // Try to find article body first
    var articleBody = document.querySelector('.article-body');
    var headerInner = document.querySelector('.article-header__inner');
    
    if (!articleBody || !headerInner) {
      return; // Exit silently if we're not on an article page
    }

    // Extract all text from article body
    var text = getTextFromNode(articleBody);
    var wordCount = countWords(text);
    var minutes = calculateReadingTime(wordCount);
    var label = minutes === 1 ? '1 min read' : minutes + ' min read';

    // Check if reading time already exists
    var existing = headerInner.querySelector('.article-header__read-time');
    if (existing) {
      existing.textContent = label;
      return;
    }

    // Create and inject reading time element
    var readTimeEl = document.createElement('p');
    readTimeEl.className = 'article-header__read-time';
    readTimeEl.setAttribute('aria-label', 'Estimated reading time');
    readTimeEl.textContent = label;
    headerInner.appendChild(readTimeEl);
  }

  // =========================================================================
  // READING PROGRESS BAR
  // =========================================================================

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
    if (wrapper) {
      wrapper.insertBefore(bar, wrapper.firstChild);
    } else {
      document.body.appendChild(bar);
    }
    
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
    
    if (fillEl) {
      fillEl.style.width = pct + '%';
    }
    
    if (barEl) {
      barEl.setAttribute('aria-valuenow', String(pct));
    }
  }

  function initReadingProgress() {
    // Only init on article pages
    if (!document.querySelector('.article-page')) {
      return;
    }

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

    // Initial update
    updateProgressBar(fill, bar);
    
    // Listen for scroll events
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  function init() {
    // Initialize theme system
    applyThemeFromStorage();
    bindThemeSwitcher();

    // Initialize article features
    if (document.querySelector('.article-body')) {
      injectReadingTime();
    }
    
    if (document.querySelector('.article-page')) {
      initReadingProgress();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
