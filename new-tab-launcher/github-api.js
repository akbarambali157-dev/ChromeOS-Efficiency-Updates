/* Shared GitHub REST client for extension pages.
   Callers own token storage and endpoint-specific UI messages. */
(function (g) {
  'use strict';

  function request(token, path, options) {
    options = options || {};
    if (typeof token !== 'string' || !token.trim() || token.length > 4096) {
      return Promise.reject(new Error('Connect a valid GitHub token first.'));
    }
    if (typeof path !== 'string' || path.charAt(0) !== '/' || path.indexOf('\\') >= 0) {
      return Promise.reject(new Error('Invalid GitHub API path.'));
    }
    var method = options.method || 'GET';
    var headers = {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json'
    };
    var body;
    if (options.body !== undefined && options.body !== null) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
    return fetch('https://api.github.com' + path, {
      method: method,
      headers: headers,
      body: body
    }).then(function (response) {
      if (response.status === 401) throw new Error('GitHub rejected the token.');
      if (response.status === 403) {
        throw new Error(options.forbiddenMessage || 'GitHub refused that request. Check token permissions.');
      }
      if (response.status === 404 && options.notFoundAsMissing) return { missing: true };
      if (response.status === 404) {
        throw new Error(options.notFoundMessage || 'GitHub could not find that resource or the token cannot access it.');
      }
      if (!response.ok) throw new Error('GitHub returned an error (' + response.status + ').');
      return response.status === 204 ? {} : response.json();
    });
  }

  g.GitHubApi = Object.freeze({ request: request });
})(window);
