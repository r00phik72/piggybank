# 🐷 TON PiggyBank

**A gamified social savings wallet for Telegram on the TON platform**

[![Vercel](https://img.shields.io/badge/deployed-vercel-000?style=flat&logo=vercel)](https://piggybank-one-weld.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TON](https://img.shields.io/badge/Built%20on-TON-0098ea?style=flat&logo=ton)](https://ton.org)

---

## 📌 Overview

TON PiggyBank — This mini-app for Telegram turns saving cryptocurrency into a fun game. Users set savings goals, track their progress with an animated 3D piggy bank, earn achievements, and create group savings with friends—all without leaving Telegram.

> **MVP launched and fully functional.** [Try it now](https://piggybank-one-weld.vercel.app/)

---

## ✨ Features

### ✅ Currently implemented

- 🐷 **3D animated piggy bank** — Interactive character with coin falling animation
- 🎯 **Goal setting** — Users set their own savings goals
- 📊 **Progress tracking** — Real-time progress indicator with percentage display
- 💰 **Simulated deposit** — Quick deposit buttons (0.5, 1, 5 TON)
- 🎉 **Goal achievement** — Festive confetti and visual feedback
- 🏦 **Simulated withdrawal** — Visual balance reset
- 🎨 **Responsive UI** — Fully responsive design for mobile and desktop devices
- 🔐 **Telegram WebApp Integration** — Native authentication via Telegram

### 🚧 In Development

- 🏆 **Achievement System** — Gamification with 5+ achievements
- 👥 **Group Savings** — Share savings with friends and family
- 💎 **TON Connect** — Real-world deposits/withdrawals via the TON Wallet
- 🧾 **NFT Checks** — Confirm savings achievements
- 📈 **STON.fi Integration** — Exchange and liquidity directly in the app

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | HTML, CSS, JavaScript, GSAP (animations), canvas-confetti |
| **Backend** | Node.js, Express |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | Vercel (Serverless Functions + Static Files) |
| **Bot** | Python, pyTelegramBotAPI |
| **Wallet** | TON Connect (planned) |
| **DeFi** | STON.fi SDK (planned) |

---

## 🚀 Quick Start

### Required Components

- Node.js (v18+)
- npm or yarn
- Supabase account (free tier)
- Telegram bot token (from @BotFather)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/r00phik72/piggybank.git
cd piggybank
