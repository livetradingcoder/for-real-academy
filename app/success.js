(function () {
  'use strict';
  var id = new URLSearchParams(location.search).get('checkout_id');
  var title = document.getElementById('s-title'), text = document.getElementById('s-text'), actions = document.getElementById('s-actions');
  function link(href, label, alt) { var a = document.createElement('a'); a.className = 'btn' + (alt ? ' alt' : ''); a.href = href; a.textContent = label; actions.append(a, ' '); }
  if (!id) { title.textContent = 'Thank you!'; text.textContent = 'Your courses are in your account.'; link('/dashboard.html', 'Go to my courses'); return; }
  var tries = 0;
  function poll() {
    FRA.api('/api/checkout-status?checkout_id=' + encodeURIComponent(id)).then(function (r) {
      if (r.__status === 401) { title.textContent = 'Payment received?'; text.textContent = 'Log in with the account you used at checkout to see your courses.'; link('/login.html?next=' + encodeURIComponent(location.pathname + location.search), 'Log in'); return; }
      if (r.status === 'succeeded') { title.textContent = 'Thank you! You’re enrolled.'; text.textContent = 'A receipt is on its way to your email. Your course is ready in your dashboard.'; link('/dashboard.html', 'Go to my courses'); return; }
      if (r.status === 'failed' || r.status === 'expired') { title.textContent = 'Payment not completed'; text.textContent = 'No charge was made for this checkout. You can try again.'; link('/courses.html', 'Back to courses'); return; }
      if (++tries > 30) { title.textContent = 'Still processing'; text.textContent = 'Your payment is taking longer than usual to confirm. Check your dashboard in a few minutes, or email hello@forrealtech.dev.'; link('/dashboard.html', 'Go to my courses'); return; }
      setTimeout(poll, 2000);
    }).catch(function () { if (++tries > 30) { text.textContent = 'Could not confirm the payment. Check your dashboard or email hello@forrealtech.dev.'; link('/dashboard.html', 'Go to my courses'); } else setTimeout(poll, 3000); });
  }
  poll();
})();
