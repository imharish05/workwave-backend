const jwt = require("jsonwebtoken");
const path = require("path");
const dotenv = require("dotenv");
const Auth = require("../Models/authModel");

dotenv.config({ path: path.join(__dirname, "..", "config", ".env") });

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.user.id;

    const user = await Auth.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = protect;
