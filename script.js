(function () {
  'use strict';
  var cfg = window.ACADEMY; if (!cfg) return;
  var money = function (n) { return '$' + n; };
  var root = document.getElementById('course-list'); if (!root) return;
  var pages = { 'web-launch': 'launch-your-first-website', 'ai-tools': 'ai-tools-for-everyday-work', 'ai-web-apps': 'build-web-apps-with-ai-assistants', 'bundle': 'complete-bundle' };
  var only = root.getAttribute('data-course');
  cfg.courses.filter(function (c) { return !only || c.id === only; }).forEach(function (c) {
    var el = document.createElement('article');
    el.className = 'card' + (c.id === 'bundle' ? ' feature' : '');
    el.innerHTML =
      '<div class="meta">' + c.level + ' · ' + c.length + '</div>' +
      '<h3>' + c.title + '</h3><p>' + c.blurb + '</p>' +
      '<ul>' + c.learn.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' +
      '<details><summary>Curriculum</summary><ol>' + c.modules.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ol>' +
      '<p><strong>Who it\'s for:</strong> ' + c.who + '</p><p><strong>You\'ll need:</strong> ' + c.requires + '</p><p><strong>You\'ll finish with:</strong> ' + c.outcome + '</p></details>' +
      (only ? '' : '<p class="more"><a href="/courses/' + pages[c.id] + '.html">Course details</a></p>') +
      '<div class="push"><div class="price">' + money(c.price) + ' <small>USD, one-time</small></div>' +
      '<div class="opts">' +
      '<label class="opt"><span><input type="radio" name="' + c.id + '" value="full" checked>Pay in full</span><strong>' + money(c.price) + '</strong></label>' +
      '<label class="opt"><span><input type="radio" name="' + c.id + '" value="split">' + c.installments.count + ' monthly payments</span><strong>' + money(c.installments.each) + '/mo</strong></label>' +
      '</div><a class="btn block" href="#">Enroll</a></div>';
    var btn = el.querySelector('.btn');
    btn.addEventListener('click', function (e) {
      var v = el.querySelector('input:checked').value;
      var url = c.checkout && c.checkout[v];
      btn.href = url || ('mailto:' + cfg.email + '?subject=' + encodeURIComponent('Enrollment: ' + c.title + ' (' + v + ')'));
    });
    root.appendChild(el);
  });
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
