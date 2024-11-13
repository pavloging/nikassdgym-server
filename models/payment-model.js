const { Schema, model } = require('mongoose');

const PaymentSchema = new Schema({
    order: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    price: { type: Number },
    date: { type: Number },
    status: { type: String, default: 'padding' },
});

module.exports = model('Payment', PaymentSchema);
