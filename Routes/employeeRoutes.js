const express = require("express");

const router = express.Router();

const {
  getProfile,
  setProfile,

  addEducation,
  editEducation,
  deleteEducation,

  setJobExperience,
  editJobExperience,
  deleteJobExperience,

  setSkills,
  editSkills,
  deleteSkills,

  setCertifications,
  editCertificate,
  deleteCertificate,

  setJobPreferences,
  editJobPreferences,
  deleteJobPreferences,

  setLanguage,
  editLanguage,
  deleteLanguage,

  setResume,
  deleteResume,
} = require("../Controllers/employeeController");

const protect = require("../Middlewares/authMiddleware.js");
const { upload } = require("../Middlewares/uploadMiddleware.js");

// Profile
router.get("/profile", protect, getProfile);
router.post("/profile", protect, setProfile);

// Education
router.post("/education", protect, addEducation);
router.put("/education/:id", protect, editEducation);
router.delete("/education/:id", protect, deleteEducation);

// experience
router.post("/experience", protect, setJobExperience);
router.put("/experience/:id", protect, editJobExperience);
router.delete("/experience/:id", protect, deleteJobExperience);

// Skills
router.post("/skills", protect, setSkills);
router.put("/skills/:id", protect, editSkills);
router.delete("/skills/:id", protect, deleteSkills);

// Certifications
router.post("/certifications", protect, setCertifications);
router.put("/certifications/:id", protect, editCertificate);
router.delete("/certifications/:id", protect, deleteCertificate);

// Job preferences
router.post("/job-preferences", protect, setJobPreferences);
router.put("/job-preferences/:id", protect, editJobPreferences);
router.delete("/job-preferences/:id", protect, deleteJobPreferences);

// Languages
router.post("/language", protect, setLanguage);
router.put("/language/:id", protect, editLanguage);
router.delete("/language/:id", protect, deleteLanguage);

// Resume
router.post("/resume", protect, upload.single("resume"), setResume);
router.delete("/resume", protect, deleteResume);

module.exports = router;
