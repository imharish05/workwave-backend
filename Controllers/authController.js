const Auth = require("../Models/authModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", "config", ".env") });

const Employee = require("../Models/employeeModel.js");
const Employer = require("../Models/employerModel.js");

const joi = require("joi");

const registerValidation = joi.object({
  userName: joi.string().optional(),
  password: joi.string().min(6).required(),
  email: joi.string().email().required(),
  role: joi.string().optional(),
});

const loginValidation = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
  role: joi.string().optional(),
});

const roleValidation = joi.object({
  role: joi.string().valid("employee", "employer").required(),
});

const registerUser = async (req, res) => {
  try {
    const { userName, password, email } = req.body;

    const { error } = registerValidation.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const existingUser = await Auth.findOne({ email });
    
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Auth.create({
      userName,
      password: hashedPassword,
      email,
      provider: "local",
    });

    const token = jwt.sign(
      {
        user: {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role || null,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { error } = loginValidation.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;

    const user = await Auth.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role || null,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const googleCallBack = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=authentication_failed`);
    }

    const token = jwt.sign(
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role || null,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ FIX: Redirect to correct frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const hasRole = user.role ? 'true' : 'false';
    
    res.redirect(
      `${frontendUrl}/google/callback?token=${token}&hasRole=${hasRole}`
    );
  } catch (err) {
    console.error('Google callback error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
};

const setRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    const { error } = roleValidation.validate({ role });
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const user = await Auth.findByIdAndUpdate(userId, { role }, { new: true });

    if (!user) return res.status(404).json({ message: "User not found" });

    const Model = role === "employee" ? Employee : Employer;

    await Model.findOneAndUpdate(
      { authId: userId },
      { authId: userId },
      { upsert: true, new: true }
    );

    // 🔁 Issue new token with updated role
    const token = jwt.sign(
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerUser, loginUser, googleCallBack, setRole };