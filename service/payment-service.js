const uuid = require('uuid');
const axios = require('axios');
const UserDto = require('../dtos/user-dto');
const paymentModel = require('../models/payment-model');
const userModel = require('../models/user-model');

class PaymentService {
    async createLinkPay({ price, name }) {
        const storeId = process.env.YOOKASSA_STORE_ID;
        const secretKey = process.env.YOOKASSA_SECRET_KEY;
        const idempotenceKey = uuid.v4();

        const data = {
            amount: {
                value: `${price}.00`,
                currency: 'RUB',
            },
            confirmation: {
                type: 'redirect',
                return_url: 'https://nikassdgym.ru/exercises',
            },
            description: `Оплата тарифа: ${name}`,
        };

        const link = await axios.post('https://api.yookassa.ru/v3/payments', data, {
            headers: {
                'Content-Type': 'application/json',
                'Idempotence-Key': idempotenceKey,
            },
            auth: {
                username: storeId,
                password: secretKey,
            },
        });

        return link.data;
    }

    async savePayment({ userId, date, price, name, order }) {
        await paymentModel.create({ order, userId, name, price, date });
    }

    async webhook(data) {
        const payment = await paymentModel.findOne({ order: data.id });
        if (!payment) throw Error('Заказ не найден по id');

        payment.status = data.status;
        await payment.save();

        if (payment.status !== 'waiting_for_capture') return `Статус у заявки ${data.id} обновился на ${payment.status}`;

        // Активация подписки
        const user = await userModel.findOne({ _id: payment.userId });
        if (!user) throw Error('Пользователь не найден по id');

        // Проверяем, есть ли у пользователя активная подписка
        if (!user.activateSubscriptionExp) {
            // Если нет, устанавливаем начальный срок подписки, начиная с текущей даты и времени
            user.activateSubscriptionExp = new Date(Date.now() + payment.date);
        } else {
            // Если подписка уже активна
            const now = new Date();

            // Проверка, истекла ли текущая подписка
            const currentExpiry = new Date(user.activateSubscriptionExp);
            const bdData = currentExpiry > now ? currentExpiry : now;

            // Добавление времени к bdData для определения новой даты окончания подписки
            const newExpiryDate = new Date(bdData.getTime() + payment.date);

            // Обновляем дату окончания подписки
            user.activateSubscriptionExp = newExpiryDate;
        }

        const storeId = process.env.YOOKASSA_STORE_ID;
        const secretKey = process.env.YOOKASSA_SECRET_KEY;
        const idempotenceKey = uuid.v4();

        const order = await axios.post(`https://api.yookassa.ru/v3/payments/${payment.order}/capture`, data, {
            headers: {
                'Content-Type': 'application/json',
                'Idempotence-Key': idempotenceKey,
            },
            auth: {
                username: storeId,
                password: secretKey,
            },
        });

        if (order.status !== 200) throw Error('Заказ не подтвердися сервисом YooKassa')

        await user.save();
        payment.status = 'success';

        await payment.save();
        return new UserDto(user);
    }
}

module.exports = new PaymentService();
