// ============================================================
//  TON PIGGYBANK — БЭКЕНД (SUPABASE)
// ============================================================

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ---------- ПОДКЛЮЧЕНИЕ К SUPABASE ----------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------- МИДЛВАРЫ ----------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ---------- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ----------
async function getUserData(telegramId) {
  let { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ telegram_id: telegramId, balance: 0, goal: 5.0 }])
      .select()
      .single();

    if (insertError) throw insertError;
    return newUser;
  }

  return data;
}

// ---------- МАРШРУТЫ ----------
app.get('/api/health', (_, res) => {
  res.json({ status: 'OK', message: '🐷 Сервер работает!' });
});

app.get('/api/balance/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await getUserData(telegramId);
    res.json({
      telegramId: user.telegram_id,
      balance: user.balance,
      goal: user.goal
    });
  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.post('/api/deposit', async (req, res) => {
  try {
    const { telegramId, amount } = req.body;
    if (!telegramId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Некорректные данные' });
    }

    const user = await getUserData(telegramId);
    const newBalance = (user.balance || 0) + amount;

    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('telegram_id', telegramId);

    if (error) throw error;

    res.json({
      telegramId,
      amount,
      newBalance,
      status: 'completed',
      message: '✅ Пополнение успешно!'
    });
  } catch (error) {
    console.error('Ошибка пополнения:', error);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

app.post('/api/update-goal', async (req, res) => {
  try {
    const { telegramId, goal } = req.body;
    if (!telegramId || !goal || goal <= 0) {
      return res.status(400).json({ error: 'Некорректные данные' });
    }

    const { error } = await supabase
      .from('users')
      .update({ goal, updated_at: new Date().toISOString() })
      .eq('telegram_id', telegramId);

    if (error) throw error;

    res.json({
      telegramId,
      goal,
      status: 'completed',
      message: '✅ Цель обновлена!'
    });
  } catch (error) {
    console.error('Ошибка обновления цели:', error);
    res.status(500).json({ error: 'Ошибка обновления цели' });
  }
});

// ---------- ЭКСПОРТ ДЛЯ VERCEL ----------
module.exports = app;