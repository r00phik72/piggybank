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

// Создаём таблицу, если её нет
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

// ---------- СТАТИКА ----------
app.use(express.static(path.join(__dirname, '..')));

// ---------- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ----------
function getUserData(telegramId, callback) {
    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
        if (err) {
            callback(err, null);
            return;
        }
        if (row) {
            callback(null, row);
        } else {
            // Если пользователь не найден — создаём
            db.run(
                'INSERT INTO users (telegram_id, balance, goal) VALUES (?, 0, 5.0)',
                [telegramId],
                (err) => {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
                        callback(err, row);
                    });
                }
            );
        }
    });
}

// ---------- МАРШРУТЫ ----------

// 1. Проверка здоровья
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: '🐷 Сервер работает!' });
});

// 2. Получить баланс и цель
app.get('/api/balance/:telegramId', (req, res) => {
    const { telegramId } = req.params;

    getUserData(telegramId, (err, user) => {
        if (err) {
            res.status(500).json({ error: 'Ошибка базы данных' });
            return;
        }
        res.json({
            telegramId: user.telegram_id,
            balance: user.balance,
            goal: user.goal
        });
    });
});

// 3. Пополнить баланс
app.post('/api/deposit', (req, res) => {
    const { telegramId, amount } = req.body;

    if (!telegramId || !amount || amount <= 0) {
        res.status(400).json({ error: 'Некорректные данные' });
        return;
    }

    getUserData(telegramId, (err, user) => {
        if (err) {
            res.status(500).json({ error: 'Ошибка базы данных' });
            return;
        }

        const newBalance = user.balance + amount;
        db.run(
            'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
            [newBalance, telegramId],
            (err) => {
                if (err) {
                    res.status(500).json({ error: 'Ошибка обновления' });
                    return;
                }
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

// 4. Обновить цель
app.post('/api/update-goal', (req, res) => {
    const { telegramId, goal } = req.body;

    if (!telegramId || !goal || goal <= 0) {
        res.status(400).json({ error: 'Некорректные данные' });
        return;
    }

    db.run(
        'UPDATE users SET goal = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
        [goal, telegramId],
        (err) => {
            if (err) {
                res.status(500).json({ error: 'Ошибка обновления цели' });
                return;
            }
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
    console.log(`🐷 Сервер с базой данных запущен: http://localhost:${PORT}`);
    console.log(`📁 Статика отдаётся из папки: ${path.join(__dirname, '..')}`);
});