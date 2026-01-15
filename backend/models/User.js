
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String }, // Captured from checkout
    password: { type: String, required: true },
    joinDate: { type: Date, default: Date.now },
    role: {
        type: String,
        enum: ['Super Admin', 'Manager', 'Editor', 'Staff', 'User'],
        default: 'User'
    },
    avatarUrl: { type: String }, // No default placeholder

    // Fields for password reset
    passwordResetToken: String,
    passwordResetExpires: Date,
});

// Password hashing middleware
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password for login
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for isAdmin
UserSchema.virtual('isAdmin').get(function () {
    return ['Super Admin', 'Manager', 'Editor', 'Staff'].includes(this.role);
});

UserSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;
