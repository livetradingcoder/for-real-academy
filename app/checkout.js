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
  var pay = $('co-pay'), err = $('co-error'), terms = $('co-terms'), gate = $('co-login');
  function render() {
    plan = document.querySelector('input[name=plan]:checked').value;
    $('co-total').textContent = plan === 'full' ? '$' + course.price + ' today' : '$' + course.installments.each + ' today, then ' + (course.installments.count - 1) + ' more monthly payments';
    history.replaceState(null, '', '?course=' + course.id + '&plan=' + plan);
    gate.querySelectorAll('a').forEach(function (a) { a.href = a.href.split('?')[0] + '?next=' + encodeURIComponent(location.pathname + location.search) + (a.dataset.signup ? '&mode=signup' : ''); });
  }
  document.querySelectorAll('input[name=plan]').forEach(function (r) { r.addEventListener('change', render); });
  render();
  var user = null;
  FRA.me().then(function (d) {
    user = d.user;
    $('co-account').textContent = user ? 'Signed in as ' + user.email : '';
    gate.hidden = !!user; $('co-pay-wrap').hidden = !user;
  });
  pay.addEventListener('click', function () {
    err.hidden = true;
    if (!terms.checked) { err.textContent = 'Please accept the terms and refund policy to continue.'; err.hidden = false; return; }
    pay.disabled = true; pay.textContent = 'Redirecting to secure checkout…';
    FRA.api('/api/checkout', 'POST', { course: course.id, plan: plan }).then(function (r) {
      if (r.url) { location.href = r.url; return; }
      err.innerHTML = ''; err.append(r.error || 'Could not start checkout. Please try again.');
      if (r.code === 'owned') { err.append(' '); var a = document.createElement('a'); a.href = '/dashboard.html'; a.textContent = 'Go to your courses'; err.append(a); }
      err.hidden = false; pay.disabled = false; pay.textContent = 'Pay securely with Polar';
    }).catch(function () { err.textContent = 'Network error. Please try again.'; err.hidden = false; pay.disabled = false; pay.textContent = 'Pay securely with Polar'; });
  });
})();
