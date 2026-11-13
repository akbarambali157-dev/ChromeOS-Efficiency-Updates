(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var SECTIONS = [
    ['layout-tools', 'Tools'],
    ['layout-sessions', 'Sessions'],
    ['layout-notes', 'Quick note'],
    ['layout-tasks', 'Tasks']
  ];
  var hidden = [];
  function applyLayout() {
    SECTIONS.forEach(function (item) {
      var el = $(item[0]);
      if (el) el.hidden = hidden.indexOf(item[0]) >= 0;
    });
  }
  function saveLayout() {
    chrome.storage.local.set({ layoutPrefs: { hidden: hidden.slice() } });
    applyLayout();
    $('layoutStatus').textContent = 'Dashboard layout saved.';
  }
  SECTIONS.forEach(function (item) {
    var label = document.createElement('label');
    label.className = 'layout-option';
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', function () {
      if (input.checked) hidden = hidden.filter(function (id) { return id !== item[0]; });
      else if (hidden.indexOf(item[0]) < 0) hidden.push(item[0]);
      saveLayout();
    });
    var span = document.createElement('span');
    span.textContent = item[1];
    label.appendChild(input); label.appendChild(span);
    $('layoutControls').appendChild(label);
    item.push(input);
  });
  function renderLayout() {
    SECTIONS.forEach(function (item) { item[2].checked = hidden.indexOf(item[0]) < 0; });
    applyLayout();
  }

  function rgb(hex) {
    var value = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return '';
    return parseInt(value.slice(0, 2), 16) + ',' +
      parseInt(value.slice(2, 4), 16) + ',' + parseInt(value.slice(4, 6), 16);
  }
  function applyPalette(palette) {
    var root = document.documentElement;
    if (palette && palette.accent && rgb(palette.accent)) root.style.setProperty('--accent-rgb', rgb(palette.accent));
    else root.style.removeProperty('--accent-rgb');
    if (palette && palette.accent2 && rgb(palette.accent2)) root.style.setProperty('--accent2-rgb', rgb(palette.accent2));
    else root.style.removeProperty('--accent2-rgb');
  }
  function colorHex(name, fallback) {
    var parts = getComputedStyle(document.documentElement).getPropertyValue(name).match(/\\d+/g);
    return parts && parts.length >= 3 ? '#' + parts.slice(0, 3).map(function (v) {
      return ('0' + Math.max(0, Math.min(255, +v)).toString(16)).slice(-2);
    }).join('') : fallback;
  }
  var baseAccent = '#7fd1b9', baseAccent2 = '#5aa9ff';
  function savePalette() {
    var palette = {};
    if ($('accentColor').value.toLowerCase() !== baseAccent) palette.accent = $('accentColor').value.toLowerCase();
    if ($('accent2Color').value.toLowerCase() !== baseAccent2) palette.accent2 = $('accent2Color').value.toLowerCase();
    applyPalette(palette);
    chrome.storage.local.set({ customPalette: palette });
    $('customColourStatus').textContent = 'Custom colours saved.';
  }
  $('accentColor').addEventListener('input', savePalette);
  $('accent2Color').addEventListener('input', savePalette);
  $('resetColours').addEventListener('click', function () {
    applyPalette(null);
    baseAccent = colorHex('--accent-rgb', '#7fd1b9');
    baseAccent2 = colorHex('--accent2-rgb', '#5aa9ff');
    $('accentColor').value = baseAccent;
    $('accent2Color').value = baseAccent2;
    chrome.storage.local.remove('customPalette');
    $('customColourStatus').textContent = 'Theme colours restored.';
  });

  function applyAccessibility(prefs) {
    var p = prefs || {};
    var size = ['small', 'normal', 'large'].indexOf(p.textSize) >= 0 ? p.textSize : 'normal';
    var density = p.density === 'compact' ? 'compact' : 'comfortable';
    document.documentElement.setAttribute('data-text-size', size);
    document.documentElement.setAttribute('data-density', density);
    if (p.highContrast) document.documentElement.setAttribute('data-contrast', 'high');
    else document.documentElement.removeAttribute('data-contrast');
    $('textSizeSel').value = size;
    $('densitySel').value = density;
    $('highContrast').checked = !!p.highContrast;
  }
  function saveAccessibility() {
    var prefs = {
      textSize: $('textSizeSel').value,
      density: $('densitySel').value,
      highContrast: $('highContrast').checked
    };
    applyAccessibility(prefs);
    chrome.storage.local.set({ accessibilityPrefs: prefs });
    $('accessibilityStatus').textContent = 'Accessibility preferences saved.';
  }
  $('textSizeSel').addEventListener('change', saveAccessibility);
  $('densitySel').addEventListener('change', saveAccessibility);
  $('highContrast').addEventListener('change', saveAccessibility);

  chrome.storage.local.get(['layoutPrefs', 'customPalette', 'accessibilityPrefs'], function (data) {
    hidden = data.layoutPrefs && Array.isArray(data.layoutPrefs.hidden)
      ? data.layoutPrefs.hidden.filter(function (id) { return SECTIONS.some(function (item) { return item[0] === id; }); }) : [];
    renderLayout();
    var palette = data.customPalette && typeof data.customPalette === 'object' ? data.customPalette : {};
    baseAccent = colorHex('--accent-rgb', '#7fd1b9');
    baseAccent2 = colorHex('--accent2-rgb', '#5aa9ff');
    $('accentColor').value = /^#[0-9a-f]{6}$/i.test(palette.accent || '') ? palette.accent : baseAccent;
    $('accent2Color').value = /^#[0-9a-f]{6}$/i.test(palette.accent2 || '') ? palette.accent2 : baseAccent2;
    applyPalette(palette);
    applyAccessibility(data.accessibilityPrefs);
  });
})();