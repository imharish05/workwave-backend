const mongoose = require("mongoose")
const dotenv = require("dotenv")
const path = require("path")

dotenv.config({path : path.join(__dirname,".env")})

const mongoURL = process.env.DB_URL

const connectDB = async() =>{
    try{
       await mongoose.connect(mongoURL)
       console.log("Mongo connected successfully")
    }
    catch(err){
        console.log(err.message)
    }
}

module.exports = connectDB;