const { body } = require('express-validator');

const authValidation = [
    body('email', 'Неверный формат почты').isEmail(),
    body('password', 'Пароль должен быть минимум 8 символов').isLength({ min: 8 }),
];

module.exports = authValidation;