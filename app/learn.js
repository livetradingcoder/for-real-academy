(function () {
  'use strict';
  var cfg = window.ACADEMY, id = new URLSearchParams(location.search).get('course');
  var course = cfg.courses.filter(function (c) { return c.id === id && c.id !== 'bundle'; })[0];
  var root = document.getElementById('learn');
  var $ = function (i) { return document.getElementById(i); };
  if (!course) { location.replace('/dashboard.html'); return; }
  var done = [], current = 0, mods = course.modules;
  var VIDEO_HOSTS = /^https:\/\/(www\.youtube-nocookie\.com|www\.youtube\.com|player\.vimeo\.com|iframe\.mediadelivery\.net|player\.mux\.com)\//;
  function pct() { return Math.round(100 * done.length / mods.length); }
  function renderNav() {
    var ol = $('modules'); ol.textContent = '';
    mods.forEach(function (m, i) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#m' + (i + 1); a.textContent = m; if (i === current) a.setAttribute('aria-current', 'true');
      if (done.indexOf(i) > -1) li.className = 'done';
      li.append(a); ol.append(li);
    });
    $('bar').firstElementChild.style.width = pct() + '%'; $('bar').setAttribute('aria-valuenow', pct());
    $('pct').textContent = done.length + ' of ' + mods.length + ' complete (' + pct() + '%)';
  }
  function show(i) {
    current = Math.max(0, Math.min(mods.length - 1, i));
    $('m-title').textContent = mods[current]; $('m-count').textContent = 'Module ' + (current + 1) + ' of ' + mods.length;
    var isDone = done.indexOf(current) > -1;
    $('complete').textContent = isDone ? '✓ Completed. Click to undo' : 'Mark as complete';
    $('complete').className = 'btn' + (isDone ? ' alt' : '');
    $('prev').hidden = current === 0; $('next').hidden = current === mods.length - 1;
    $('m-video').textContent = ''; $('m-notes').textContent = 'Loading…';
    renderNav();
    var at = current;
    FRA.api('/api/lesson?course=' + id + '&module=' + current).then(function (r) {
      if (at !== current) return;
      $('m-notes').textContent = '';
      if (r.video && VIDEO_HOSTS.test(r.video)) { var f = document.createElement('iframe'); f.src = r.video; f.title = mods[current]; f.allowFullscreen = true; f.loading = 'lazy'; f.referrerPolicy = 'strict-origin'; $('m-video').append(f); }
      (r.notes || '').split(/\n\s*\n/).filter(Boolean).forEach(function (t) { var p = document.createElement('p'); p.textContent = t; $('m-notes').append(p); });
      if (!r.video && !r.notes) { var p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Materials for this module are being prepared and will appear here. You can still track your progress.'; $('m-notes').append(p); }
    });
  }
  $('complete').addEventListener('click', function () {
    var want = done.indexOf(current) === -1, btn = $('complete'); btn.disabled = true;
    FRA.api('/api/progress', 'POST', { course: id, module: current, done: want }).then(function (r) {
      btn.disabled = false; if (r.completed) { done = r.completed; show(current); if (want && current < mods.length - 1) $('next').focus(); }
    });
  });
  $('prev').addEventListener('click', function () { location.hash = '#m' + current; });
  $('next').addEventListener('click', function () { location.hash = '#m' + (current + 2); });
  window.addEventListener('hashchange', function () { var n = parseInt(location.hash.slice(2), 10); if (n) show(n - 1); });
  $('crumb').textContent = course.title; $('course-name').textContent = course.title;
  FRA.me().then(function (d) {
    if (!d.user) { location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search)); return; }
    var e = (d.enrollments || []).filter(function (x) { return x.course_id === id && x.status === 'active' && (!x.expires_at || new Date(x.expires_at) > new Date()); })[0];
    if (!e) { location.replace('/courses.html'); return; }
    done = (d.progress || {})[id] || [];
    var n = parseInt(location.hash.slice(2), 10);
    show(n ? n - 1 : Math.min(mods.length - 1, done.length ? Math.max.apply(null, done) + 1 : 0));
    root.hidden = false;
  });
})();
