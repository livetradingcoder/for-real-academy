(function () {
  'use strict';
  var cfg = window.ACADEMY, q = new URLSearchParams(location.search);
  var course = cfg.courses.filter(function (c) { return c.id === q.get('course'); })[0];
  var root = document.getElementById('checkout-root');
  if (!course) { root.innerHTML = '<p>That course was not found. <a href="/courses.html">Browse the courses</a>.</p>'; return; }
  var plan = q.get('plan') === 'split' ? 'split' : 'full';
  var $ = function (id) { return document.getElementById(id); };
  $('co-title').textContent = course.title;
  $('co-meta').textContent = course.level + ' · ' + course.length;
  $('co-blurb').textContent = course.blurb;
  $('co-full').textContent = '$' + course.price;
  $('co-split').textContent = course.installments.count + ' × $' + course.installments.each + '/mo';
  document.querySelector('input[value="' + plan + '"]').checked = true;
  var pay = $('co-pay'), err = $('co-error'), terms = $('co-terms'), email = $('co-email');
  function render() {
    plan = document.querySelector('input[name=plan]:checked').value;
    $('co-total').textContent = plan === 'full' ? '$' + course.price + ' today' : '$' + course.installments.each + ' today, then ' + (course.installments.count - 1) + ' more monthly payments';
    history.replaceState(null, '', '?course=' + course.id + '&plan=' + plan);
    $('co-login').querySelector('a').href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search);
  }
  document.querySelectorAll('input[name=plan]').forEach(function (r) { r.addEventListener('change', render); });
  render();
  FRA.me().then(function (d) {
    if (!d.user) return;
    email.value = d.user.email; email.readOnly = true; $('co-name').value = d.user.name || ''; $('co-name').readOnly = true;
    $('co-email-note').textContent = 'Signed in. This course will be added to your account.'; $('co-login').hidden = true;
  });
  function fail(msg) { err.textContent = msg; err.hidden = false; pay.disabled = false; pay.textContent = 'Pay securely with Polar'; }
  pay.addEventListener('click', function () {
    err.hidden = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { fail('Enter a valid email address.'); email.focus(); return; }
    if (!terms.checked) { fail('Please accept the terms and refund policy to continue.'); return; }
    pay.disabled = true; pay.textContent = 'Redirecting to secure checkout…';
    FRA.api('/api/checkout', 'POST', { course: course.id, plan: plan, email: email.value.trim(), name: $('co-name').value }).then(function (r) {
      if (r.url) { location.href = r.url; return; }
      fail(r.error || 'Could not start checkout. Please try again.');
      if (r.code === 'owned') { err.append(' '); var a = document.createElement('a'); a.href = '/login.html?next=%2Fdashboard.html'; a.textContent = 'Log in to your courses'; err.append(a); }
    }).catch(function () { fail('Network error. Please try again.'); });
  });
})();
