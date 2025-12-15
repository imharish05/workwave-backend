const {newEmployer,deleteEmployer} = require("../Controllers/employerController.js");

const express = require("express");

const protect = require("../Middlewares/authMiddleware.js");

const router = express.Router();

router.post("/",protect, newEmployer);
router.delete("/",protect, deleteEmployer);

module.exports = router;