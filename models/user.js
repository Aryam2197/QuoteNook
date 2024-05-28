// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     username: {
//         type: String,
//         required: [true, 'Username cannot be blank']
//     },
//     email: {
//         type: String,
//         required: [true, 'Email cannot be blank'],
//         unique: true // Ensure email is unique
//     },
//     password: {
//         type: String,
//         required: [true, 'Password cannot be blank']
//     }
// });

// const User = mongoose.model('User', userSchema);

// module.exports = User;
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
    },
    otp: {
        type: Number, // Assuming OTP is stored as a number
        default: null // Default value for OTP
    },
    otpExpiration: {
        type: Date, // Assuming OTP expiration is stored as a Date
        default: null // Default value for OTP expiration
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
