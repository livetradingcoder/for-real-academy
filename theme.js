(function () {
  'use strict';
  var root = document.documentElement, KEY = 'theme', saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved !== 'dark' && saved !== 'light') saved = null;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function current() { return saved || (mq && mq.matches ? 'dark' : 'light'); }
  function apply() { root.setAttribute('data-theme', current()); }
  apply();
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (!saved) apply(); });
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-toggle'); if (!btn) return;
    function label() { btn.setAttribute('aria-label', 'Switch to ' + (current() === 'dark' ? 'light' : 'dark') + ' theme'); }
    label();
    btn.addEventListener('click', function () {
      saved = current() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, saved); } catch (e) {}
      apply(); label();
    });
  });
})();
