// ============================================================
//  app.js
// ============================================================

// ---------- СОСТОЯНИЕ ----------
let balance = 0.0;
let goal = 5.0;
let statusTimeout = null;
let telegramId = null;
let goalReached = false;

// ---------- DOM ----------
const piggy = document.getElementById('piggy');
const balanceDisplay = document.getElementById('balanceDisplay');
const progressFill = document.getElementById('progressFill');
const statusMessage = document.getElementById('statusMessage');
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const changeGoalBtn = document.getElementById('changeGoalBtn');
const coin = document.getElementById('coin');

// ---------- TELEGRAM ID ----------
function getTelegramId() {
  try {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    }
  } catch (_) {}
  console.warn('⚠️ Используется тестовый ID');
  return 'test_user_123';
}

// ---------- ЗАГРУЗКА С СЕРВЕРА ----------
async function loadFromServer() {
  telegramId = getTelegramId();
  try {
    const res = await fetch(`https://piggybank-one-weld.vercel.app/api/balance/${telegramId}`);
    const data = await res.json();

    balance = data.balance ?? 0;
    goal = data.goal ?? 5.0;

    if (balance >= goal) {
      goalReached = true;
      updateButtonStates();
    }

    const savedGoal = localStorage.getItem('piggybank_goal');
    if (savedGoal) {
      goal = parseFloat(savedGoal);
    } else if (goal > 5.0 || goal !== 5.0) {
      localStorage.setItem('piggybank_goal', goal.toString());
    } else {
      showGoalPrompt();
    }

    updateUI();
  } catch (_) {
    loadGoal();
  }
}

// ---------- СОХРАНЕНИЕ НА СЕРВЕР ----------
function saveToServer(amount) {
  if (!telegramId) return;
  const initData = window.Telegram?.WebApp?.initData || '';
  fetch('https://piggybank-one-weld.vercel.app/api/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramId, balance, goal, amount, initData })
  }).catch(() => {});
}

// ---------- СОХРАНЕНИЕ ЦЕЛИ ----------
async function saveGoalToServer() {
  if (!telegramId) return;
  const initData = window.Telegram?.WebApp?.initData || '';
  try {
    const res = await fetch('https://piggybank-one-weld.vercel.app/api/update-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, goal, initData })
    });
    const data = await res.json();
    console.log('✅ Ответ сервера:', data);
  } catch (error) {
    console.error('❌ Ошибка сохранения цели:', error);
  }
}

// ---------- ОБНОВЛЕНИЕ КНОПОК ----------
function updateButtonStates() {
  // Название кнопки всегда "🏦 Вывести", меняется только цвет
  withdrawBtn.textContent = '🏦 Вывести';
  if (goalReached) {
    withdrawBtn.classList.remove('btn-secondary');
    withdrawBtn.classList.add('btn-withdraw-success');
    changeGoalBtn.classList.remove('btn-secondary');
    changeGoalBtn.classList.add('btn-goal-success');
  } else {
    withdrawBtn.classList.remove('btn-withdraw-success');
    withdrawBtn.classList.add('btn-secondary');
    changeGoalBtn.classList.remove('btn-goal-success');
    changeGoalBtn.classList.add('btn-secondary');
  }
}

// ---------- ОБРАБОТЧИК КНОПКИ "ВЫВЕСТИ" ----------
function handleWithdraw() {
  if (goalReached) {
    // Если цель достигнута — сбрасываем баланс
    balance = 0;
    goalReached = false;
    updateButtonStates();
    saveToServer(0);
    updateUI();
    setTemporaryMessage('💸 Баланс сброшен до 0. Начни копить заново!');
  } else {
    // Если цель не достигнута — показываем остаток
    if (balance < 0.5) {
      setTemporaryMessage('😢 Слишком мало! Накопи хотя бы 0.5 TON');
      return;
    }
    setTemporaryMessage(`⏳ Осталось ${(goal - balance).toFixed(1)} TON до цели`);
  }
}

// ---------- КОНФЕТТИ ----------
function launchConfetti() {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 }
  });
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 50,
      origin: { y: 0.6 }
    });
  }, 300);
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 40,
      origin: { y: 0.6 }
    });
  }, 600);
}

// ---------- UI ----------
function updateUI() {
  balanceDisplay.textContent = balance.toFixed(2);
  const percent = Math.min((balance / goal) * 100, 100);
  progressFill.style.width = percent + '%';

  let label = document.querySelector('.percent-text');
  if (!label) {
    label = document.createElement('span');
    label.className = 'percent-text';
    document.querySelector('.progress-container').appendChild(label);
  }
  label.textContent = Math.round(percent) + '%';

  if (balance >= goal && !goalReached) {
    goalReached = true;
    updateButtonStates();
    launchConfetti();
    statusMessage.textContent = '🎉 Ура! Вывод доступен! (пока симуляция)';
    statusMessage.dataset.temporary = 'true';
    return;
  }

  if (statusMessage.dataset.temporary) return;
  if (balance >= goal) {
    statusMessage.textContent = '🎉 Ура! Вывод доступен! (пока симуляция)';
  } else if (balance > 0) {
    statusMessage.textContent = '🐽 Отлично! Продолжай копить!';
  } else {
    statusMessage.textContent = `🎯 Цель: ${goal} TON. Копи дальше!`;
  }
}

function setTemporaryMessage(text) {
  if (statusTimeout) clearTimeout(statusTimeout);
  statusMessage.textContent = text;
  statusMessage.dataset.temporary = 'true';
  statusTimeout = setTimeout(() => {
    statusMessage.dataset.temporary = '';
    updateUI();
    statusTimeout = null;
  }, 3000);
}

// ---------- ПОПАП ЦЕЛИ ----------
function showGoalPrompt() {
  const old = document.getElementById('goalPopup');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'goalPopup';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    background: #fff;
    padding: 30px 40px;
    border-radius: 24px;
    max-width: 320px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
  `;

  card.innerHTML = `
    <h2 style="color:#ec4899; margin-bottom:12px;">🐷 Цель накопления</h2>
    <p style="color:#6b7280; font-size:14px; margin-bottom:20px;">
      Сколько TON ты хочешь накопить?
    </p>
    <input id="goalInput" type="number" step="0.1" min="0.1" value="${goal}"
           style="width:100%; padding:12px; font-size:18px; border:2px solid #fbcfe8; border-radius:12px; box-sizing:border-box; margin-bottom:16px;" />
    <button id="goalSaveBtn" style="
      background:#ec4899; color:white; font-weight:bold;
      padding:12px 32px; border:none; border-radius:40px;
      font-size:18px; cursor:pointer; width:100%;
      box-shadow:0 4px 14px rgba(236,72,153,0.4);
    ">Сохранить</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  document.getElementById('goalSaveBtn').addEventListener('click', async () => {
    const val = parseFloat(document.getElementById('goalInput').value);
    if (isNaN(val) || val <= 0) {
      alert('Введи число больше 0');
      return;
    }
    goal = val;
    goalReached = false;
    localStorage.setItem('piggybank_goal', goal.toString());
    overlay.remove();
    updateUI();
    await saveGoalToServer();
    setTemporaryMessage(`🎯 Цель: ${val} TON`);
  });
}

function loadGoal() {
  const saved = localStorage.getItem('piggybank_goal');
  if (saved) {
    goal = parseFloat(saved);
  } else {
    showGoalPrompt();
  }
}

// ---------- АНИМАЦИИ ----------
function piggySqueal() {
  gsap.fromTo(piggy, { scale: 1, rotate: 0 }, {
    scale: 1.2,
    rotate: 5,
    duration: 0.15,
    yoyo: true,
    repeat: 2,
    onComplete: () => {
      gsap.to(piggy, { scale: 1, rotate: 0, duration: 0.2 });
    }
  });
}

function createSparkles(x, y) {
  const colors = ['#ffe066', '#f5b700', '#ffd700', '#ffec8b', '#ffffff'];
  for (let i = 0; i < 12; i++) {
    const spark = document.createElement('div');
    const size = 4 + Math.random() * 8;
    const color = colors[Math.floor(Math.random() * colors.length)];
    spark.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: ${size}px; height: ${size}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
      box-shadow: 0 0 12px ${color};
    `;
    document.body.appendChild(spark);
    const angle = Math.random() * 2 * Math.PI;
    const dist = 50 + Math.random() * 80;
    const dur = 0.5 + Math.random() * 0.4;
    gsap.to(spark, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 40,
      opacity: 0,
      scale: 0,
      duration: dur,
      ease: 'power2.out',
      onComplete: () => spark.remove()
    });
  }
}

function flyCoinToPiggy() {
  gsap.killTweensOf(coin);

  coin.style.display = 'block';
  coin.style.opacity = '1';
  coin.style.left = (window.innerWidth / 2 - 30) + 'px';
  coin.style.top = '-80px';
  coin.style.width = '60px';
  coin.style.height = '60px';
  coin.style.transform = 'none';
  coin.style.position = 'fixed';

  gsap.set(coin, {
    x: 0,
    y: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1
  });

  const rect = piggy.getBoundingClientRect();
  const targetX = rect.left + rect.width / 2 - 30;
  const targetY = rect.top - 10;

  gsap.to(coin, {
    x: targetX - parseInt(coin.style.left),
    y: targetY + 80,
    duration: 0.9,
    ease: 'none',
    opacity: 0.9,
    scale: 0.3,
    rotationX: 720,
    rotationY: 540,
    rotationZ: 180,
    onComplete: () => {
      createSparkles(targetX + 30, targetY + 30);
      piggySqueal();
      gsap.to(coin, {
        scale: 0,
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          coin.style.display = 'none';
          gsap.set(coin, { x: 0, y: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1 });
        }
      });
    }
  });
}

// ---------- СОБЫТИЯ ----------
piggy.addEventListener('click', () => {
  piggySqueal();
  const msgs = ['Хрю! 🐽', 'Ещё!', 'Копи-копи!', 'Люблю! ❤️'];
  setTemporaryMessage(msgs[Math.floor(Math.random() * msgs.length)]);
});

depositBtn.addEventListener('click', () => {
  const amount = 0.5 + Math.random() * 1.0;
  flyCoinToPiggy();
  setTimeout(() => {
    balance += amount;
    updateUI();
    saveToServer(amount);
    setTemporaryMessage(`+${amount.toFixed(2)} TON! 🎉`);
  }, 1200);
});

// ---------- ЕДИНЫЙ ОБРАБОТЧИК ДЛЯ КНОПКИ ВЫВОДА ----------
withdrawBtn.addEventListener('click', handleWithdraw);

// ---------- БЫСТРЫЕ ДЕПОЗИТЫ ----------
document.querySelectorAll('.quick-deposit').forEach(btn => {
  btn.addEventListener('click', function() {
    const amount = parseFloat(this.dataset.amount);
    if (isNaN(amount) || amount <= 0) return;

    balance += amount;
    updateUI();
    saveToServer(amount);
    setTemporaryMessage(`+${amount.toFixed(2)} TON! 🎉`);
  });
});

// ---------- НОВАЯ ЦЕЛЬ ----------
changeGoalBtn.addEventListener('click', () => {
  showGoalPrompt();
});

// ---------- СТАРТ ----------
loadFromServer();
console.log('🐷 TON PiggyBank загружен');