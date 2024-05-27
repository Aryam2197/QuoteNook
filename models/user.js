const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username cannot be blank']
    },
    email: {
        type: String,
        required: [true, 'Email cannot be blank'],
        unique: true // Ensure email is unique
    },
    password: {
        type: String,
        required: [true, 'Password cannot be blank']
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
