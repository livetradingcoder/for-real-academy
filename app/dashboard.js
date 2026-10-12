(function () {
  'use strict';
  var cfg = window.ACADEMY, root = document.getElementById('dash');
  function el(tag, attrs, kids) { var n = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); }); (kids || []).forEach(function (c) { n.append(c); }); return n; }
  FRA.me().then(function (d) {
    if (!d.user) { location.replace('/login.html?next=' + encodeURIComponent('/dashboard.html')); return; }
    document.getElementById('dash-user').textContent = d.user.name ? d.user.name : d.user.email;
    document.getElementById('logout').addEventListener('click', function () { FRA.api('/api/auth/logout', 'POST').then(function () { location.href = '/'; }); });
    if (d.needsPassword) {
      var b = document.getElementById('pw-banner'); b.hidden = false;
      document.getElementById('pw-form').addEventListener('submit', function (ev) {
        ev.preventDefault(); var er = document.getElementById('pw-error'); er.hidden = true;
        FRA.api('/api/auth/set-password', 'POST', { password: document.getElementById('pw-pass').value }).then(function (r) {
          if (r.ok) { b.hidden = true; } else { er.textContent = r.error || 'Could not save your password.'; er.hidden = false; }
        });
      });
    }
    var owned = {}; (d.enrollments || []).forEach(function (e) { owned[e.course_id] = e; });
    var mine = cfg.courses.filter(function (c) { return c.id !== 'bundle' && owned[c.id]; });
    var others = cfg.courses.filter(function (c) { return !(c.id !== 'bundle' && owned[c.id]); });
    var list = document.getElementById('mine'); list.textContent = '';
    if (!mine.length) list.append(el('div', { class: 'card' }, [el('h3', { text: 'No courses yet' }), el('p', { text: 'Once you enroll, your courses and progress show up here.' }), el('a', { class: 'btn', href: '/courses.html', text: 'Browse the courses' })]));
    mine.forEach(function (c) {
      var e = owned[c.id], ends = e.expires_at ? new Date(e.expires_at) : null, expired = !!ends && ends < new Date(), done = ((d.progress || {})[c.id] || []).length, total = c.modules.length, pct = Math.round(100 * done / total), active = e.status === 'active' && !expired;
      var bar = el('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': c.title + ' progress' }, [el('span', { style: 'width:' + pct + '%' })]);
      var action = active ? el('a', { class: 'btn block', href: '/learn.html?course=' + c.id, text: done ? (done === total ? 'Review course' : 'Continue') : 'Start course' })
        : el('p', { class: 'note', text: expired ? 'Your platform access ended on ' + ends.toLocaleDateString() + '. Buy this course to keep learning.' : e.status === 'refunded' ? 'This purchase was refunded, so access has ended.' : 'Access paused: a payment did not go through. Contact hello@forrealtech.dev.' });
      list.append(el('article', { class: 'card' }, [el('div', { class: 'meta', text: c.level + ' · ' + c.length }), el('h3', { text: c.title }), bar, el('p', { class: 'meta', text: done + ' of ' + total + ' modules complete (' + pct + '%)' + (ends && !expired ? ' · access until ' + ends.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '') }), el('div', { class: 'push' }, [action])]));
    });
    var more = document.getElementById('more'); more.textContent = '';
    others.forEach(function (c) { more.append(el('a', { class: 'post-card', href: '/courses/' + ({ 'web-launch': 'launch-your-first-website', 'ai-tools': 'ai-tools-for-everyday-work', 'ai-web-apps': 'build-web-apps-with-ai-assistants', bundle: 'complete-bundle', 'platform-access': 'platform-access' })[c.id] + '.html' }, [el('span', { class: 'tag', text: c.level }), el('h3', { text: c.title }), el('span', { class: 'go', text: 'View course →' })])); });
    document.getElementById('more-wrap').hidden = !others.length;
    root.hidden = false;
  });
})();
