const mongoose = require("mongoose")
const passportLocalMongoose = require("passport-local-mongoose")


const authSchema = new mongoose.Schema({

    username: String,
    password: String

})

authSchema.plugin(passportLocalMongoose) //to hash and salt passwords and to save our users to out mongoDB database


module.exports = mongoose.model("authData", authSchema)

