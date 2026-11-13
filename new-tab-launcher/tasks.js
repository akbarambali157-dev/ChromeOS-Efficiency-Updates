(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('taskForm');
  if (!form) return;
  var titleInput = $('taskTitle');
  var dueInput = $('taskDue');
  var list = $('taskList');
  var tasks = [];

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function validDate(value) {
    if (!value) return true;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var p = value.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    return d.getFullYear() === p[0] && d.getMonth() === p[1] - 1 && d.getDate() === p[2];
  }

  function normalizeTasks(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (t) {
      return t && typeof t.title === 'string' && t.title.trim() && t.title.length <= 160;
    }).slice(0, 100).map(function (t, i) {
      return {
        id: String(t.id || ('task-' + i)).slice(0, 80),
        title: t.title.trim(),
        due: validDate(t.due) ? (t.due || '') : '',
        done: !!t.done,
        created: isFinite(+t.created) ? +t.created : Date.now()
      };
    });
  }
  function dueLabel(value) {
    if (!value) return '';
    var date = new Date(value + 'T00:00:00');
    return 'Due ' + date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function save() {
    var snapshot = tasks.map(function (t) {
      return { id: t.id, title: t.title, due: t.due || '', done: !!t.done, created: +t.created || Date.now() };
    });
    chrome.storage.local.set({ tasks: snapshot }, function () {
      if (chrome.runtime.lastError) $('taskSummary').textContent = 'Could not save tasks. Your changes are still visible in this tab.';
    });
  }
  function render() {
    list.textContent = '';
    var open = tasks.filter(function (t) { return !t.done; }).length;
    $('taskCount').textContent = open + ' open';
    $('taskSummary').textContent = tasks.length
      ? (tasks.length - open) + ' completed · ' + open + ' remaining'
      : 'A small list that stays saved on this device.';
    if (!tasks.length) {
      var empty = document.createElement('p');
      empty.className = 'task-empty';
      empty.textContent = 'Your task list is empty. Add something above to get started.';
      list.appendChild(empty);
      return;
    }
    var sorted = tasks.slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
      if (a.due && !b.due) return -1;
      if (!a.due && b.due) return 1;
      return (+b.created || 0) - (+a.created || 0);
    });
    sorted.forEach(function (task) {
      var row = document.createElement('div');
      row.className = 'task-item' + (task.done ? ' done' : '') + (!task.done && task.due && task.due < todayKey() ? ' overdue' : '');
      var check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'task-check';
      check.checked = !!task.done;
      check.setAttribute('aria-label', (task.done ? 'Mark incomplete: ' : 'Complete: ') + task.title);
      check.addEventListener('change', function () {
        task.done = check.checked;
        save(); render();
      });
      var copy = document.createElement('div');
      copy.className = 'task-copy';
      var name = document.createElement('span');
      name.className = 'task-title';
      name.textContent = task.title;
      copy.appendChild(name);
      if (task.due) {
        var meta = document.createElement('span');
        meta.className = 'task-meta';
        meta.textContent = dueLabel(task.due) + (!task.done && task.due < todayKey() ? ' · overdue' : '');
        copy.appendChild(meta);
      }
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'task-delete';
      del.textContent = '×';
      del.title = 'Delete task';
      del.setAttribute('aria-label', 'Delete task: ' + task.title);
      del.addEventListener('click', function () {
        tasks = tasks.filter(function (t) { return t.id !== task.id; });
        save(); render();
      });
      row.appendChild(check); row.appendChild(copy); row.appendChild(del);
      list.appendChild(row);
    });
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var title = titleInput.value.trim();
    var due = dueInput.value;
    if (!title || title.length > 160 || !validDate(due)) return;
    if (tasks.length >= 100) {
      $('taskSummary').textContent = 'Task limit reached (100). Delete completed tasks to add more.';
      return;
    }
    tasks.push({
      id: String(Date.now()) + '-' + String(Math.floor(Math.random() * 100000)),
      title: title,
      due: due,
      done: false,
      created: Date.now()
    });
    titleInput.value = '';
    dueInput.value = '';
    save(); render(); titleInput.focus();
  });
  chrome.storage.local.get('tasks', function (data) {
    tasks = normalizeTasks(data.tasks);
    render();
  });
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local' || !changes.tasks) return;
    tasks = normalizeTasks(changes.tasks.newValue);
    render();
  });
})();
