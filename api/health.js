module.exports = (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: '🐷 Тестовый эндпоинт работает!',
    time: new Date().toISOString()
  });
};