    const mongoose = require("mongoose")

    const authSchema = new mongoose.Schema({
        email : {type:String,required : true,unique : true},
        password : {type:String},
        provider : {type : String,default : "local"},
        googleId : String,
        role : {type :String, enum : ["employee","employer"],default : "employee"}
    },{timestamps : true})

    const Auth = mongoose.model("Auth",authSchema)

    module.exports = Auth;