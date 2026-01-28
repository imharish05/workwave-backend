const express = require("express");

const router = express.Router();

const passport = require("passport");

const {
  registerUser,
  loginUser,
  googleCallBack,
  setRole,
} = require("../Controllers/authController.js");
const protect = require("../Middlewares/authMiddleware.js");

// Routes

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/role",protect,setRole)


router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {session: false,failureRedirect: "/login"}),
  googleCallBack
)

module.exports = router;
