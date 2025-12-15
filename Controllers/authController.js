const Auth = require("../Models/authModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", "config", ".env") });

const Employee = require("../Models/employeeModel.js");
const Employer = require("../Models/employerModel.js");

const joi = require("joi")

const registerValidation = joi.object({
  password : joi.string().min(6).required(),
  email: joi.string().email().required(),
  role: joi.string().optional()
})

const loginValidation = joi.object({
  email : joi.string().email().required(),
  password :joi.string().min(6).required()
})

const roleValidation = joi.object({
  role: joi.string().valid("employee", "employer").required(),
});

const registerUser = async (req, res) => {
  try {
    const {password, email } = req.body;

    const {error}= registerValidation.validate(req.body)

    if (error) return res.status(400).json({ message: error.details[0].message});

    const existingUser = await Auth.findOne({ email });

    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Auth.create({
      password: hashedPassword,
      email,
      provider: "local",
    });

    if (newUser.role === "employee") {
      await Employee.create({
        authId: newUser._id,
      });
    }

    if (newUser.role === "employer") {
      await Employer.create({
        authId: newUser._id,
      });
    }

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ user: { id: newUser._id, email }, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const {error} = loginValidation.validate(req.body)

    if(error) return res.status(400).json({message : error.details[0].message})

    const user = await Auth.findOne({ email });

    if (!user) return res.status(403).json({ message: "User does not Exist" });

    if (user.provider === "google")
      return res
        .status(403)
        .json({ message: `Use Google to sign in with this account` });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).json({ message: "Invalid Password" });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res
      .status(200)
      .json({
        user: { id: user._id, email: user.email },
        token,
      });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const googleCallBack = async (req, res) => {
  try {
    const user = req.user;

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      user: { id: user._id, email: user.email },
      token,
      message: "Logged in successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const setRole = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { role } = req.body;

    const { error } = roleValidation.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const user = await Auth.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          role,
        },
      },
      { new: true, runValidators: true }
    );

    if (!user)
      return res.status(404).json({ message: "User profile not found" });

    const Model = role === "employee" ? Employee : Employer;

    await Model.findOneAndUpdate(
      { authId: userId },
      { $set: { role } },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerUser, loginUser, googleCallBack, setRole };
