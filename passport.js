const path = require("path")
const dotenv = require("dotenv")
const Auth = require("./Models/authModel.js")
const Employee = require("./Models/employeeModel.js")

dotenv.config({path : path.join(__dirname,"config",".env")})

const passport = require("passport")
const {Strategy : googleStrategy} = require("passport-google-oauth20")

passport.use(new googleStrategy({
    clientID : process.env.CLIENT_ID,
    clientSecret : process.env.CLIENT_SECRET,
    callbackURL : process.env.CLIENT_URL
},
async(accessToken,refreshToken,profile,done)=>{
try{

    //Getting details from google
    const googleId = profile.id
    const email = profile.emails[0].value
    const userName = profile.displayName

    // Checking user is already exist
    let user = await Auth.findOne({googleId})

    // If not by googleId then by email
    if(!user){
        user = await Auth.findOne({email})
    }

    // If there is no user we are creating one in Auth
    if(!user){
        user = await Auth.create({
            userName,
            email,
            googleId,
            password : null,
            provider : "google"
        })
    }

    if(user.role  === "employee"){
        await Employee.create({
            authId : user._id
        })
    }
    return done(null,user)
}
catch(err){
    return done(err,null)
}
}))

module.exports = passport