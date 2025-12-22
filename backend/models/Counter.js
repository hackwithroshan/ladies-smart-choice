
const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 1000 } // Starts at 1000, so first increment is 1001
});

module.exports = mongoose.model('Counter', CounterSchema);
