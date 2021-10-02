const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    creationDate: {
        type: Date,
        default: (Date.now())
    },
    email: {
        type: String,
        required: true,
        match: /.+\@.+\..+/,
        unique: true
    },
    password: {
        type: String,
        required: true,
        max: 1024,
        min: 6
    },
    username: {
        type: String,
        required: true,
        index: true,
        unique: true,
        max: 255,
        min: 6
    }
});

module.exports = mongoose.model('User', userSchema)