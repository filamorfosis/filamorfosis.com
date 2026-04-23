/**
 * search-autocomplete.js — Fuzzy-match search autocomplete for products.html
 *
 * Attaches to #catSearch, debounces input at 150ms, runs fuzzy match against
 * window.PRODUCTS, and renders a dropdown with up to 8 results.
 *
 * Exports (for Node.js property tests):
 *   module.exports = { levenshtein, normalizeStr, getMatches }
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     Core pure functions (also exported for tests)
  ───────────────────────────────────────────── */

  function normalizeStr(str) {
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function levenshtein(a, b) {
    var m = a.length;
    var n = b.length;
    var prev = new Array(n + 1);
    var curr = new Array(n + 1);
    for (var j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
      curr[0] = i;
      for (var k = 1; k <= n; k++) {
        if (a[i - 1] === b[k - 1]) {
          curr[k] = prev[k - 1];
        } else {
          curr[k] = 1 + Math.min(prev[k - 1], prev[k], curr[k - 1]);
        }
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[n];
  }

  function getMatches(query, catalog, limit) {
    if (limit === undefined) limit = 8;
    var q = normalizeStr(query);
    if (q.length < 2) return [];

    var results = [];
    for (var i = 0; i < catalog.length && results.length < limit; i++) {
      var product = catalog[i];
      var name = normalizeStr(product.name || '');

      if (name.includes(q)) {
        results.push(product);
        continue;
      }

      if (q.length >= 4 && name.length >= 4) {
        if (levenshtein(q, name) <= 2) {
          results.push(product);
          continue;
        }
        var words = name.split(/\s+/);
        var matched = false;
        for (var w = 0; w < words.length; w++) {
          if (words[w].length >= 4 && levenshtein(q, words[w]) <= 2) {
            matched = true;
            break;
          }
        }
        if (matched) results.push(product);
      }
    }
    return results;
  }

  /* ─────────────────────────────────────────────
     Node.js export (for property tests)
  ───────────────────────────────────────────── */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { levenshtein: levenshtein, normalizeStr: normalizeStr, getMatches: getMatches };
    return;
  }

  /* ─────────────────────────────────────────────
     DOM / browser code
  ───────────────────────────────────────────── */

  var _input = null;
  var _dropdown = null;
  var _debounceTimer = null;
  var _activeIndex = -1;
  var _currentMatches = [];

  function getSuggestion(query, catalog) {
    var q = normalizeStr(query);
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < catalog.length; i++) {
      var name = normalizeStr(catalog[i].name || '');
      var dist = levenshtein(q, name);
      if (dist <= 3 && dist < bestDist) {
        bestDist = dist;
        best = catalog[i];
      }
    }
    return best;
  }

  function closeDropdown() {
    if (_dropdown) {
      _dropdown.remove();
      _dropdown = null;
    }
    _activeIndex = -1;
    if (_input) {
      _input.removeAttribute('aria-activedescendant');
      _input.setAttribute('aria-expanded', 'false');
    }
  }

  function updateActiveItem(index) {
    if (!_dropdown) return;
    var items = _dropdown.querySelectorAll('li[role="option"]');
    items.forEach(function (li, i) {
      if (i === index) {
        li.setAttribute('aria-selected', 'true');
        _input.setAttribute('aria-activedescendant', li.id);
      } else {
        li.setAttribute('aria-selected', 'false');
      }
    });
    _activeIndex = index;
  }

  function renderDropdown(matches, query) {
    closeDropdown();

    var wrap = _input.closest('.cat-search-wrap') || _input.parentElement;
    wrap.style.position = 'relative';

    _dropdown = document.createElement('ul');
    _dropdown.className = 'search-autocomplete-dropdown';
    _dropdown.setAttribute('role', 'listbox');
    _dropdown.setAttribute('id', 'search-autocomplete-listbox');

    _currentMatches = matches;

    if (matches.length === 0) {
      renderNoResults(query);
      wrap.appendChild(_dropdown);
      _input.setAttribute('aria-expanded', 'true');
      return;
    }

    matches.forEach(function (product, i) {
      var li = document.createElement('li');
      li.className = 'search-autocomplete-item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.id = 'search-ac-item-' + i;

      var img = document.createElement('img');
      img.className = 'search-autocomplete-item__img';
      img.width = 32;
      img.height = 32;
      img.loading = 'lazy';
      img.alt = product.name || '';
      var thumb = (product.images && product.images[0]) || product.image || product.thumbnail || '';
      img.src = thumb || '';
      if (!thumb) img.style.background = 'var(--dark3, #1e293b)';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'search-autocomplete-item__name';
      nameSpan.textContent = product.name || '';

      var catSpan = document.createElement('span');
      catSpan.className = 'search-autocomplete-item__cat';
      catSpan.textContent = product.category || product.categoryLabel || '';

      li.appendChild(img);
      li.appendChild(nameSpan);
      li.appendChild(catSpan);

      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        openProduct(product);
      });

      _dropdown.appendChild(li);
    });

    wrap.appendChild(_dropdown);
    _input.setAttribute('aria-expanded', 'true');
    _input.setAttribute('aria-controls', 'search-autocomplete-listbox');
  }

  function renderNoResults(query) {
    var div = document.createElement('div');
    div.className = 'search-autocomplete-no-results';

    var msg = document.createElement('p');
    msg.textContent = 'No encontramos resultados para \u201c' + query + '\u201d';
    div.appendChild(msg);

    var catalog = window.PRODUCTS || [];
    var suggestion = getSuggestion(query, catalog);
    if (suggestion) {
      var suggLink = document.createElement('a');
      suggLink.className = 'search-autocomplete-suggestion';
      suggLink.href = '#';
      suggLink.textContent = '\u00bfQuisiste decir ' + suggestion.name + '?';
      suggLink.addEventListener('mousedown', function (e) {
        e.preventDefault();
        _input.value = suggestion.name;
        var newMatches = getMatches(suggestion.name, catalog);
        renderDropdown(newMatches, suggestion.name);
      });
      div.appendChild(suggLink);
    }

    var cta = document.createElement('a');
    cta.className = 'search-autocomplete-suggestion';
    cta.href = '#';
    cta.textContent = 'Ver todos los productos';
    cta.addEventListener('mousedown', function (e) {
      e.preventDefault();
      closeDropdown();
      _input.value = '';
    });
    div.appendChild(cta);

    _dropdown.appendChild(div);
  }

  function openProduct(product) {
    closeDropdown();
    _input.value = product.name || '';
    var id = product.id || product.productId;
    if (id && typeof window.openModal === 'function') {
      window.openModal(id);
    }
  }

  function handleKeydown(e) {
    if (!_dropdown) return;
    var items = _dropdown.querySelectorAll('li[role="option"]');
    var count = items.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        updateActiveItem((_activeIndex + 1) % count);
        break;
      case 'ArrowUp':
        e.preventDefault();
        updateActiveItem((_activeIndex - 1 + count) % count);
        break;
      case 'Enter':
        e.preventDefault();
        if (_activeIndex >= 0 && _currentMatches[_activeIndex]) {
          openProduct(_currentMatches[_activeIndex]);
        }
        break;
      case 'Escape':
        closeDropdown();
        break;
    }
  }

  function runSearch(query) {
    var catalog = window.PRODUCTS || [];
    if (!query || query.length < 2) {
      closeDropdown();
      return;
    }
    var matches = getMatches(query, catalog);
    renderDropdown(matches, query);
  }

  function initSearchAutocomplete() {
    _input = document.getElementById('catSearch');
    if (!_input) return;

    _input.setAttribute('role', 'combobox');
    _input.setAttribute('aria-autocomplete', 'list');
    _input.setAttribute('aria-expanded', 'false');
    _input.setAttribute('aria-haspopup', 'listbox');

    _input.addEventListener('input', function () {
      clearTimeout(_debounceTimer);
      var val = _input.value.trim();
      _debounceTimer = setTimeout(function () {
        runSearch(val);
      }, 150);
    });

    _input.addEventListener('keydown', handleKeydown);

    _input.addEventListener('blur', function () {
      setTimeout(closeDropdown, 150);
    });

    document.addEventListener('click', function (e) {
      if (_dropdown && !_dropdown.contains(e.target) && e.target !== _input) {
        closeDropdown();
      }
    });
  }

  window.initSearchAutocomplete = initSearchAutocomplete;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('catSearch')) initSearchAutocomplete();
    });
  } else {
    if (document.getElementById('catSearch')) initSearchAutocomplete();
  }
})();
