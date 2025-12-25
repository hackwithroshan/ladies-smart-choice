
const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 10000 } // Starts at 10000, so first increment is 10001
});

module.exports = mongoose.model('Counter', CounterSchema);
