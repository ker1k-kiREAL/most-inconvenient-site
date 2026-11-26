/* ===== КОНСТАНТЫ ===== */
var MAX_LOGIN = 1;
var MAX_ESCAPES = 8;

function $(id) { return document.getElementById(id); }

var login = $('login');
var password = $('password');
var captcha = $('captcha');
var agree = $('agree');
var enterBtn = $('enterBtn');
var cancelBtn = $('cancelBtn');
var modal = $('modal');
var modalTitle = $('modalTitle');
var modalText = $('modalText');
var modalBtn = $('modalBtn');
var trashEl = $('trash');
var trashCountEl = $('trashCount');
var loginHint = $('loginHint');
var timerEl = $('timer');

var trashCount = 0;
var escapes = 0;
var clicks = 0;
var buttonTired = false;
var createMode = false;
/* ===== ЗВУК (тихий бип) ===== */
var audioCtx = null;
function beep(freq) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.frequency.value = freq || 440;
    o.connect(g);
    g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.04, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o.start();
    o.stop(audioCtx.currentTime + 0.15);
  } catch (e) { /* без звука тоже неудобно */ }
}

/* ===== КОРЗИНА СИМВОЛОВ ===== */
function dropToTrash(char, fromRect) {
  var s = document.createElement('span');
  s.className = 'fallingChar';
  s.textContent = char;
  var sx = fromRect.left + fromRect.width / 2;
  var sy = fromRect.top + 6;
  s.style.left = sx + 'px';
  s.style.top = sy + 'px';
  document.body.appendChild(s);
  var tr = trashEl.getBoundingClientRect();
  var dx = tr.left + tr.width / 2 - sx;
  var dy = tr.top + 12 - sy;
  requestAnimationFrame(function () {
    s.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) rotate(' +
      (Math.round(Math.random() * 360 - 180)) + 'deg) scale(0.4)';
    s.style.opacity = '0';
  });
  setTimeout(function () { s.remove(); }, 1400);
  trashCount++;
  trashCountEl.textContent = trashCount;
  beep(180 + Math.random() * 220);
}
login.addEventListener('input', function () {
  var v = login.value;
  if (v.length > MAX_LOGIN) {
    var rect = login.getBoundingClientRect();
    var extra = v.slice(MAX_LOGIN);
    for (var i = 0; i < extra.length; i++) {
      if (extra[i] !== '\n') dropToTrash(extra[i], rect);
    }
    login.value = v.slice(0, MAX_LOGIN);
    loginHint.textContent = 'Потеряно символов: ' + trashCount +
      '. Они теперь в корзине внизу. Backspace их не вернёт. Никто не вернёт.';
  }
});

/* ===== УБЕГАЮЩАЯ КНОПКА ===== */
var escapeLabels = ['ВОЙТИ', 'ВОЙТИ (поймай меня)', 'ХА-ХА', 'СЛИШКОМ МЕДЛЕННО', 'ПОЧТИ!', 'НЕТ', 'ЕЩЁ РАЗОК', 'ЛАДНО, ЛОВИ!'];

function moveButton(e) {
  if (buttonTired) return;
  if (!e || e.clientX === undefined) return;
  var r = enterBtn.getBoundingClientRect();
  var cx = r.left + r.width / 2;
  var cy = r.top + r.height / 2;
  if (Math.hypot(e.clientX - cx, e.clientY - cy) > 150) return;

  var margin = 12;
  var maxX = window.innerWidth - r.width - margin;
  var maxY = window.innerHeight - r.height - margin;
  var nx, ny, tries = 0;
  do {
    nx = margin + Math.random() * Math.max(1, maxX - margin);
    ny = margin + Math.random() * Math.max(1, maxY - margin);
    tries++;
  } while (Math.hypot(nx - e.clientX, ny - e.clientY) < 220 && tries < 20);

  enterBtn.style.position = 'fixed';
  enterBtn.style.left = nx + 'px';
  enterBtn.style.top = ny + 'px';
  enterBtn.style.zIndex = '999';
  escapes++;
  if (escapes < MAX_ESCAPES) {
    enterBtn.textContent = escapeLabels[Math.min(escapes, escapeLabels.length - 1)];
  } else {
    buttonTired = true;
    enterBtn.textContent = 'ладно, ловите…';
    enterBtn.classList.add('tired');
  }
  beep(620);
}
document.addEventListener('mousemove', moveButton);
document.addEventListener('touchstart', moveButton, { passive: true });
/* ===== МОДАЛКА ===== */
function showModal(title, text, buttonLabel) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  if (buttonLabel) modalBtn.textContent = buttonLabel;
  modal.classList.remove('hidden');
}

modalBtn.addEventListener('click', function () {
  modal.classList.add('hidden');
  if (createMode) {
    createMode = false;
    setTimeout(function () {
      showModal('РЕГИСТРАЦИЯ', 'Регистрация закрыта с 2003 года. Приходите в 2099 году. Или не приходите.');
    }, 300);
  }
});

/* ===== ОТПРАВКА ФОРМЫ ===== */
var excuses = [
  'Аккаунт не найден. Ни один аккаунт не найден. Все аккаунты разом не найдены.',
  'Сервер ушёл на обед. Вернётся… может быть.',
  'Ошибка 404: причина не найдена.',
  'Аккаунт найден! Сожалеем, это была ошибка. Аккаунт не найден.'
];

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!buttonTired) {
    showModal('СЛИШКОМ ПРОСТО', 'Войти по кнопке — так не интересно. Сначала попробуйте её поймать. Она уже убежала ' + escapes + ' раз.');
    return;
  }
  if (!login.value.trim()) {
    showModal('ОШИБКА 001', 'Введите логин. Напоминаем: максимум 1 символ. Минимум — тоже.');
    return;
  }
  if (!agree.checked) {
    showModal('ОШИБКА 002', 'Сначала подтвердите, что вы не читали правила и всё равно согласны.');
    return;
  }
  if (captcha.value !== '8') {
    showModal('ОШИБКА 003', 'Неверный ответ на капчу. Подсказка: правильный ответ (42) туда физически не влезает. Так задумано. Sorry.');
    return;
  }
  if (!password.value) {
    showModal('ОШИБКА 004', 'Введите пароль. Не волнуйтесь, его уже видели все.');
    return;
  }
  clicks++;
  if (clicks < 3) {
    showModal('РЕЗУЛЬТАТ ПРОВЕРКИ', excuses[Math.floor(Math.random() * excuses.length)]);
  } else {
    createMode = true;
    showModal('Аккаунт не найден', 'Аккаунт не найден. Возможно, стоит создать аккаунт? Кнопка ниже обещает помочь. Правда обещает.', 'Создать аккаунт');
  }
});
/* ===== ОТМЕНА ===== */
cancelBtn.addEventListener('click', function () {
  showModal('ОТМЕНА', 'Отмена не предусмотрена. Вход обязателен. Жмите ВОЙТИ — она ловкая.');
});

/* ===== ТАЙМЕР «ПЕРЕЗАГРУЗКИ» ===== */
var t = 10;
setInterval(function () {
  t--;
  if (t <= 0) {
    t = 10;
    showModal('ОБНОВЛЕНИЕ', 'Мы чуть не перезагрузили эту страницу. Но передумали: вы нам нравитесь. Отсчёт начинается заново.');
  }
  timerEl.textContent = t;
}, 1000);

/* ===== УВЕДОМЛЕНИЕ ===== */
setTimeout(function () {
  showModal('ВАЖНОЕ УВЕДОМЛЕНИЕ', 'Ваш пароль истекает через −3 года. Смените его в разделе «Настройки», которого не существует.');
}, 20000);
