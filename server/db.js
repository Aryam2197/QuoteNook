const mongoose = require('mongoose');

const connectDB = () => {
    mongoose.connect('mongodb://127.0.0.1:27017/QouteNook')
        .then(() => {
            console.log("CONNECTED!");
        })
        .catch(err => {
            console.log("CONNECTION FAILED!!", err);
        });
};

module.exports = connectDB;
