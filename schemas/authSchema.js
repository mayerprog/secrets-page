const mongoose = require("mongoose")
const passportLocalMongoose = require("passport-local-mongoose")
const findOrCreate = require("mongoose-findorcreate")



const authSchema = new mongoose.Schema({

    username: String,
    password: String,
    googleId: String,
    secret: String

})

authSchema.plugin(passportLocalMongoose) //to hash and salt passwords and to save our users to out mongoDB database
authSchema.plugin(findOrCreate)


module.exports = mongoose.model("authData", authSchema)

