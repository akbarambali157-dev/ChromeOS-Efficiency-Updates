/* Small, identical helpers shared by extension pages.
   Keep page-specific selectors, status messages and URL-host policies local. */
(function (g) {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function formatGiB(bytes) {
    return (bytes / 1073741824).toFixed(1);
  }

  function plural(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
  }

  function normalizeUrl(value) {
    value = value.trim();
    return /^https?:\/\//i.test(value) ? value : 'https://' + value;
  }

  g.LauncherUtils = Object.freeze({
    el: el,
    formatGiB: formatGiB,
    plural: plural,
    normalizeUrl: normalizeUrl
  });
})(window);
