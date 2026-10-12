(function () {
  'use strict';
  var q = new URLSearchParams(location.search), next = FRA.safeNext(q.get('next'));
  var mode = q.get('mode') === 'signup' ? 'signup' : 'login';
  var form = document.getElementById('auth-form'), err = document.getElementById('auth-error');
  var tabs = document.querySelectorAll('[data-mode]'), nameRow = document.getElementById('name-row');
  var title = document.getElementById('auth-title'), submit = document.getElementById('auth-submit'), pw = document.getElementById('password');
  function setMode(m) {
    mode = m; err.hidden = true;
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.mode === m)); });
    nameRow.hidden = m !== 'signup';
    title.textContent = m === 'signup' ? 'Create your account' : 'Welcome back';
    submit.textContent = m === 'signup' ? 'Create account' : 'Log in';
    pw.autocomplete = m === 'signup' ? 'new-password' : 'current-password';
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { setMode(t.dataset.mode); }); });
  setMode(mode);
  FRA.me().then(function (d) { if (d.user) location.replace(next); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); err.hidden = true; submit.disabled = true;
    var data = { email: form.email.value, password: pw.value };
    if (mode === 'signup') data.name = form.name.value;
    FRA.api('/api/auth/' + mode, 'POST', data).then(function (r) {
      if (r.user) { location.href = next; return; }
      err.textContent = r.error || 'Something went wrong. Please try again.'; err.hidden = false; submit.disabled = false;
    }).catch(function () { err.textContent = 'Network error. Please try again.'; err.hidden = false; submit.disabled = false; });
  });
})();
