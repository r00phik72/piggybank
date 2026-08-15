// ============================================================
//  TON PIGGYBANK — ЛОГИКА С БЭКЕНДОМ
// ============================================================

// ---------- СОСТОЯНИЕ ----------
let balance = 0.0;
let goal = 5.0;
let statusTimeout = null;
let telegramId = null;

// ---------- DOM-ЭЛЕМЕНТЫ ----------
const piggy = document.getElementById('piggy');
const balanceDisplay = document.getElementById('balanceDisplay');
const progressFill = document.getElementById('progressFill');
const statusMessage = document.getElementById('statusMessage');
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const coin = document.getElementById('coin');

// ---------- ПОЛУЧЕНИЕ TELEGRAM ID ----------
function getTelegramId() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const user = window.Telegram.WebApp.initDataUnsafe?.user;
            if (user && user.id) {
                return user.id.toString();
            }
        }
    } catch (e) {
        console.warn('Telegram WebApp не доступен');
    }
    // Если не в Telegram — используем тестовый ID
    return 'test_user_123';
}

// ---------- ЗАГРУЗКА ДАННЫХ С СЕРВЕРА ----------
async function loadFromServer() {
    telegramId = getTelegramId();
    try {
        const response = await fetch(`http://localhost:3000/api/balance/${telegramId}`);
        const data = await response.json();
        balance = data.balance || 0;
        goal = data.goal || 5.0;
        updateUI();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Если сервер не отвечает — работаем локально
        loadGoal();
    }
}

// ---------- СОХРАНЕНИЕ ДАННЫХ НА СЕРВЕР ----------
async function saveToServer() {
    try {
        await fetch('http://localhost:3000/api/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: telegramId,
                balance: balance,
                goal: goal
            })
        });
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

// ---------- ОБНОВЛЕНИЕ UI ----------
function updateUI() {
    balanceDisplay.textContent = balance.toFixed(2);
    const percent = Math.min((balance / goal) * 100, 100);
    progressFill.style.width = percent + '%';

    let percentLabel = document.querySelector('.percent-text');
    if (!percentLabel) {
        percentLabel = document.createElement('span');
        percentLabel.className = 'percent-text';
        document.querySelector('.progress-container').appendChild(percentLabel);
    }
    percentLabel.textContent = Math.round(percent) + '%';

    if (!statusMessage.dataset.temporary) {
        if (balance >= goal) {
            statusMessage.textContent = '🎉 Цель достигнута! Ты красавчик!';
        } else if (balance > 0) {
            statusMessage.textContent = '🐽 Отлично! Продолжай копить!';
        } else {
            statusMessage.textContent = `🎯 Цель: ${goal} TON. Копи дальше!`;
        }
    }
}

// ---------- ВРЕМЕННОЕ СООБЩЕНИЕ ----------
function setTemporaryMessage(text) {
    if (statusTimeout) {
        clearTimeout(statusTimeout);
        statusTimeout = null;
    }
    statusMessage.textContent = text;
    statusMessage.dataset.temporary = 'true';
    statusTimeout = setTimeout(() => {
        statusMessage.dataset.temporary = '';
        updateUI();
        statusTimeout = null;
    }, 3000);
}

// ---------- ПОПАП ДЛЯ ВВОДА ЦЕЛИ ----------
function showGoalPrompt() {
    const oldPopup = document.getElementById('goalPopup');
    if (oldPopup) oldPopup.remove();

    const overlay = document.createElement('div');
    overlay.id = 'goalPopup';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
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
        <h2 style="color: #ec4899; margin-bottom: 12px;">🐷 Цель накопления</h2>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
            Сколько TON ты хочешь накопить?
        </p>
        <input id="goalInput" type="number" step="0.1" min="0.1" value="5.0"
               style="width: 100%; padding: 12px; font-size: 18px; border: 2px solid #fbcfe8; border-radius: 12px; box-sizing: border-box; margin-bottom: 16px;" />
        <button id="goalSaveBtn" style="
            background: #ec4899;
            color: white;
            font-weight: bold;
            padding: 12px 32px;
            border: none;
            border-radius: 40px;
            font-size: 18px;
            cursor: pointer;
            width: 100%;
            box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
        ">Сохранить</button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('goalSaveBtn').addEventListener('click', () => {
        const input = document.getElementById('goalInput');
        const value = parseFloat(input.value);
        if (isNaN(value) || value <= 0) {
            alert('Введи число больше 0');
            return;
        }
        goal = value;
        localStorage.setItem('piggybank_goal', goal.toString());
        overlay.remove();
        updateUI();
        saveToServer();
        setTemporaryMessage(`🎯 Цель: ${value} TON`);
    });
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
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            box-shadow: 0 0 12px ${color};
        `;
        document.body.appendChild(spark);
        const angle = Math.random() * 2 * Math.PI;
        const distance = 50 + Math.random() * 80;
        const duration = 0.5 + Math.random() * 0.4;
        gsap.to(spark, {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance - 40,
            opacity: 0,
            scale: 0,
            duration: duration,
            ease: 'power2.out',
            onComplete: () => spark.remove()
        });
    }
}

function flyCoinToPiggy() {
    const startX = Math.random() * window.innerWidth;
    const startY = -80;
    coin.style.display = 'block';
    coin.style.left = startX + 'px';
    coin.style.top = startY + 'px';
    coin.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    coin.style.opacity = '1';
    const piggyRect = piggy.getBoundingClientRect();
    const targetX = piggyRect.left + piggyRect.width / 2 - 30;
    const targetY = piggyRect.top - 10;
    gsap.to(coin, {
        left: targetX,
        top: targetY,
        duration: 1.0,
        ease: 'power2.in',
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
                }
            });
        }
    });
}

// ---------- СОБЫТИЯ ----------
piggy.addEventListener('click', () => {
    piggySqueal();
    const messages = ['Хрю! 🐽', 'Ещё!', 'Копи-копи!', 'Люблю! ❤️'];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setTemporaryMessage(randomMsg);
});

depositBtn.addEventListener('click', () => {
    const amount = 0.5 + Math.random() * 1.0;
    flyCoinToPiggy();
    setTimeout(() => {
        balance += amount;
        updateUI();
        saveToServer();
        setTemporaryMessage(`+${amount.toFixed(2)} TON! 🎉`);
    }, 1200);
});

withdrawBtn.addEventListener('click', () => {
    if (balance < 0.5) {
        setTemporaryMessage('😢 Слишком мало! Накопи хотя бы 0.5 TON');
        return;
    }
    if (balance >= goal) {
        setTemporaryMessage('🎉 Ура! Вывод доступен! (пока симуляция)');
    } else {
        setTemporaryMessage(`⏳ Осталось ${(goal - balance).toFixed(1)} TON до цели`);
    }
});

// ---------- СТАРТ ----------
loadFromServer();
console.log('🐷 TON PiggyBank загружен');