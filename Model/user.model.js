const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    contact: String,
    username: String,
    password: String,
    profilePhoto: String,
    gender: String,
    cartProduct: [],
})
const saltRound = 10;
userSchema.pre('save', function (next) {
    bcrypt.hash(this.password, saltRound, (err, hashedPassword) => {
        if (err) {
            console.log(`there is error`);
        } else {
            this.password = hashedPassword
            next()
        }
    })
})
userSchema.methods.validatePassword = function (password, callback) {
    bcrypt.compare(password, this.password, (err, same) => {
        if (!err) {
            callback(err, same)
        } else {
            next()
        }
    })
}

const userModel = mongoose.model('user_tb', userSchema)

module.exports = { userModel }