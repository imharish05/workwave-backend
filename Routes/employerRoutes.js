const express = require("express");
const protect = require("../Middlewares/authMiddleware.js");

const {
  newEmployer,
  getEmployer,
  deleteEmployer,
  updateEmployerLocation,
  updateEmployerHR,
  updateEmployerDescription,
} = require("../Controllers/employerController.js");

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                          BASE EMPLOYER PROFILE                              */
/* -------------------------------------------------------------------------- */

// Create / Full update (upsert)
router.post("/", protect, newEmployer);

// Get employer profile
router.get("/", protect, getEmployer);

// Delete employer profile
router.delete("/", protect, deleteEmployer);

/* -------------------------------------------------------------------------- */
/*                          PARTIAL UPDATES (EDIT)                             */
/* -------------------------------------------------------------------------- */

// Update company location
router.patch("/location", protect, updateEmployerLocation);

// Update HR details
router.patch("/hr", protect, updateEmployerHR);

// Update company description
router.patch("/description", protect, updateEmployerDescription);

module.exports = router;
