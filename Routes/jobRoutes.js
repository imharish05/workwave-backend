const {
  createJob,
  updateJob,
  getAllJobs,
  getJobById,
  getJobByEmployer,
  deleteById
} = require("../Controllers/jobController.js");

const express = require("express");
const protect = require("../Middlewares/authMiddleware.js");

const router = express.Router();

router.post("/", protect,createJob);
router.put("/:id", protect,updateJob);
router.delete("/:id", protect,deleteById);
router.get("/all-jobs",protect,getAllJobs);
router.get("/employer/:id",protect,getJobByEmployer);
router.get("/:id",protect, getJobById);

module.exports = router;
