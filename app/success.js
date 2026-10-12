(function () {
  'use strict';
  var id = new URLSearchParams(location.search).get('checkout_id');
  var $ = function (i) { return document.getElementById(i); };
  var title = $('s-title'), text = $('s-text'), actions = $('s-actions'), setup = $('setup');
  function link(href, label, alt) { var a = document.createElement('a'); a.className = 'btn' + (alt ? ' alt' : ''); a.href = href; a.textContent = label; actions.append(a, ' '); }
  if (!id) { title.textContent = 'Thank you!'; text.textContent = 'Your courses are in your account.'; link('/dashboard.html', 'Go to my courses'); return; }
  var tries = 0;
  function showSetup(r) {
    title.textContent = 'Payment received. Set up your account'; text.textContent = 'One last step so you can log in later.';
    $('setup-note').textContent = 'Your account: ' + r.email + '. A receipt from Polar is on its way to the same address.';
    setup.hidden = false; $('sp-pass').focus();
  }
  setup.addEventListener('submit', function (e) {
    e.preventDefault(); $('sp-error').hidden = true; $('sp-submit').disabled = true;
    FRA.api('/api/auth/set-password', 'POST', { password: $('sp-pass').value, name: $('sp-name').value }).then(function (r) {
      if (r.ok) { location.href = '/dashboard.html'; return; }
      $('sp-error').textContent = r.error || 'Could not save your password. Please try again.'; $('sp-error').hidden = false; $('sp-submit').disabled = false;
    }).catch(function () { $('sp-error').textContent = 'Network error. Please try again.'; $('sp-error').hidden = false; $('sp-submit').disabled = false; });
  });
  function poll() {
    FRA.api('/api/checkout-status?checkout_id=' + encodeURIComponent(id)).then(function (r) {
      if (r.status === 'succeeded') {
        if (r.needsPassword) return showSetup(r);
        title.textContent = 'Thank you! You’re enrolled.';
        if (r.signedIn) { text.textContent = 'A receipt is on its way to your email. Your course is ready in your dashboard.'; link('/dashboard.html', 'Go to my courses'); }
        else { text.textContent = 'The course was added to the account for ' + r.email + '. Log in to start.'; link('/login.html?next=%2Fdashboard.html', 'Log in'); }
        return;
      }
      if (r.status === 'failed' || r.status === 'expired') { title.textContent = 'Payment not completed'; text.textContent = 'No charge was made for this checkout. You can try again.'; link('/courses.html', 'Back to courses'); return; }
      if (++tries > 30) { title.textContent = 'Still processing'; text.textContent = 'Your payment is taking longer than usual to confirm. Reload this page in a minute, or email hello@forrealtech.dev with your receipt.'; return; }
      setTimeout(poll, 2000);
    }).catch(function () { if (++tries > 30) { text.textContent = 'Could not confirm the payment. Reload this page or email hello@forrealtech.dev.'; } else setTimeout(poll, 3000); });
  }
  poll();
})();
