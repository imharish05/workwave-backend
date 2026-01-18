const express = require("express");

const router = express.Router();

const {
  getProfile,
  setProfile,

  addEducation,
  getEducation,
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
  getResume,
  getSkills,
  getCertificates,
  getJobPreference,
  getLanguage,
  getJobExperience,
  updateProfile,
  getAppliedJobs,

} = require("../Controllers/employeeController");

const protect = require("../Middlewares/authMiddleware.js");
const { upload } = require("../Middlewares/uploadMiddleware.js");

// Profile
router.get("/profile", protect, getProfile);
router.post("/profile", protect, setProfile);
router.put("/profile", protect, updateProfile);

// Education
router.get("/education", protect, getEducation);
router.post("/education", protect, addEducation);
router.put("/education/:id", protect, editEducation);
router.delete("/education/:id", protect, deleteEducation);


// experience
router.get("/experience", protect, getJobExperience);
router.post("/experience", protect, setJobExperience);
router.put("/experience/:id", protect, editJobExperience);
router.delete("/experience/:id", protect, deleteJobExperience);

// Skills
router.get("/skills", protect, getSkills);
router.post("/skills", protect, setSkills);
router.put("/skills/:id", protect, editSkills);
router.delete("/skills/:id", protect, deleteSkills);

// Certifications
router.get("/certifications", protect, getCertificates);
router.post("/certifications", protect, setCertifications);
router.put("/certifications/:id", protect, editCertificate);
router.delete("/certifications/:id", protect, deleteCertificate);

// Job preferences
router.get("/job-preferences", protect, getJobPreference);
router.post("/job-preferences", protect, setJobPreferences);
router.put("/job-preferences/:id", protect, editJobPreferences);
router.delete("/job-preferences/:id", protect, deleteJobPreferences);

// Languages
router.get("/language", protect, getLanguage);
router.post("/language", protect, setLanguage);
router.put("/language/:id", protect, editLanguage);
router.delete("/language/:id", protect, deleteLanguage);

// Resume
router.get("/resume", protect, getResume);
router.post("/resume", protect, upload.single("resume"), setResume);
router.delete("/resume", protect, deleteResume);


// AppliedJobs

router.get("/applied-jobs", protect, getAppliedJobs);

module.exports = router;
