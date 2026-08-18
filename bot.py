import telebot
import time

TOKEN = "8220720945:AAEyJeSawmx3QsvL3SnYotKfhwuowVAHaEA"
WEBAPP_URL = "https://piggybank-one-weld.vercel.app"

bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def start(message):
    markup = telebot.types.InlineKeyboardMarkup()
    btn = telebot.types.InlineKeyboardButton(
        "🐷 Открыть PiggyBank",
        web_app=telebot.types.WebAppInfo(WEBAPP_URL)
    )
    markup.add(btn)
    bot.send_message(
        message.chat.id,
        f"🐷 Привет! Нажми на кнопку, чтобы открыть копилку.\n\nТвой ID: {message.chat.id}",
        reply_markup=markup
    )

if __name__ == "__main__":
    print("🐷 Бот запущен")
    while True:
        try:
            bot.polling(none_stop=True, interval=1)
        except:
            time.sleep(5)