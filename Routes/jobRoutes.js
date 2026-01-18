const express = require("express");
const protect = require("../Middlewares/authMiddleware.js");

const {
  createJob,
  updateJob,
  getAllJobs,
  getJobByKey,
  deleteJob,
  applyJob,
  getJobByEmployer
} = require("../Controllers/jobController.js");

const router = express.Router();

router.post("/", protect, createJob);
router.get("/all-jobs", protect, getAllJobs);
router.get("/employer", protect, getJobByEmployer);
router.post("/apply/:id", protect, applyJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);
router.get("/:id", protect, getJobByKey);




module.exports = router;
