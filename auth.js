// Shared client helpers: API calls and the nav "Log in / Dashboard" link.
(function () {
  'use strict';
  var meCache;
  function api(path, method, data) {
    return fetch(path, { method: method || 'GET', credentials: 'same-origin', headers: data ? { 'content-type': 'application/json' } : {}, body: data ? JSON.stringify(data) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.__status = r.status; return j; }); });
  }
  function me(force) { if (!meCache || force) meCache = api('/api/auth/me'); return meCache; }
  function safeNext(n) { return typeof n === 'string' && /^\/[A-Za-z0-9_\-./?=&%#]*$/.test(n) && n.indexOf('//') !== 0 ? n : '/dashboard.html'; }
  window.FRA = { api: api, me: me, safeNext: safeNext };
  document.addEventListener('DOMContentLoaded', function () {
    var link = document.getElementById('nav-auth'); if (!link) return;
    me().then(function (d) { if (d && d.user) { link.textContent = 'Account'; link.href = '/dashboard.html'; } }).catch(function () {});
  });
})();
