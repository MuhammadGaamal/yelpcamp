var mongoose = require("mongoose"),
    passportlocalmongoose = require("passport-local-mongoose");

// setup the schema
var userSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    password: String,
    avatar: String,
    firstName: String,
    lastName: String,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {type: Boolean, default: false}
});
userSchema.plugin(passportlocalmongoose);
module.exports = mongoose.model("User", userSchema);
