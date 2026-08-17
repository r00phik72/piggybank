// ============================================================
//  TON PIGGYBANK — БЭКЕНД (NODE.JS + EXPRESS + SQLite)
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// ---------- БАЗА ДАННЫХ ----------
const db = new sqlite3.Database('./piggybank.db');

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id TEXT PRIMARY KEY,
    balance REAL DEFAULT 0,
    goal REAL DEFAULT 5.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ---------- МИДЛВАРЫ ----------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ---------- ВСПОМОГАТЕЛЬНО ----------
function getUserData(telegramId, callback) {
  db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
    if (err) return callback(err, null);
    if (row) return callback(null, row);

    db.run(
      'INSERT INTO users (telegram_id, balance, goal) VALUES (?, 0, 5.0)',
      [telegramId],
      (err) => {
        if (err) return callback(err, null);
        db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
          callback(err, row);
        });
      }
    );
  });
}

// ---------- МАРШРУТЫ ----------
app.get('/api/health', (_, res) => {
  res.json({ status: 'OK', message: '🐷 Сервер работает!' });
});

app.get('/api/balance/:telegramId', (req, res) => {
  const { telegramId } = req.params;
  getUserData(telegramId, (err, user) => {
    if (err) return res.status(500).json({ error: 'Ошибка БД' });
    res.json({
      telegramId: user.telegram_id,
      balance: user.balance,
      goal: user.goal
    });
  });
});

app.post('/api/deposit', (req, res) => {
  const { telegramId, amount } = req.body;
  if (!telegramId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Некорректные данные' });
  }

  getUserData(telegramId, (err, user) => {
    if (err) return res.status(500).json({ error: 'Ошибка БД' });

    const newBalance = user.balance + amount;
    db.run(
      'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
      [newBalance, telegramId],
      (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка обновления' });
        res.json({
          telegramId,
          amount,
          newBalance,
          status: 'completed',
          message: '✅ Пополнение успешно!'
        });
      }
    );
  });
});

// ---------- ЭНДПОИНТ ДЛЯ ОБНОВЛЕНИЯ ЦЕЛИ (С ЛОГАМИ) ----------
app.post('/api/update-goal', (req, res) => {
  console.log('📥 Получен запрос на обновление цели:', req.body);

  const { telegramId, goal } = req.body;

  if (!telegramId || !goal || goal <= 0) {
    console.log('❌ Некорректные данные:', { telegramId, goal });
    return res.status(400).json({ error: 'Некорректные данные' });
  }

  db.run(
    'UPDATE users SET goal = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
    [goal, telegramId],
    (err) => {
      if (err) {
        console.error('❌ Ошибка обновления цели:', err);
        return res.status(500).json({ error: 'Ошибка обновления цели' });
      }
      console.log('✅ Цель обновлена для пользователя:', telegramId, 'Новая цель:', goal);
      res.json({
        telegramId,
        goal,
        status: 'completed',
        message: '✅ Цель обновлена!'
      });
    }
  );
});

// ---------- ЗАПУСК ----------
app.listen(PORT, () => {
  console.log(`🐷 Сервер запущен: http://localhost:${PORT}`);
  console.log(`📁 Статика: ${path.join(__dirname, '..')}`);
});