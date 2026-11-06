/* Load the non-critical scripts after first paint. weather.js and commandbar.js
   are not needed to render the page, and on a 2 GB machine parsing them during
   load is felt. requestIdleCallback exists in Chrome 103; the timeout guard
   keeps the page working if it is ever missing. */
(function () {
  'use strict';
  var SRC = ['weather.js', 'commandbar.js'];
  function later() {
    SRC.forEach(function (src) {
      var s = document.createElement('script');
      s.src = src;
      document.body.appendChild(s);
    });
  }
  if (window.requestIdleCallback) requestIdleCallback(later, { timeout: 1200 });
  else setTimeout(later, 200);
})();
