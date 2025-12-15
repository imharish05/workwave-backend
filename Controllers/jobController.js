const Job = require("../Models/jobModel.js");

const Employer = require("../Models/employerModel.js");

const joi = require("joi");

const jobValidation = joi.object({
  title: joi.string().trim().required(),
  description: joi.string().allow("").optional(),
  type: joi.string().valid("Full Time", "Part Time", "Internship").optional(),
  experience: joi.number().min(0).optional(),
  location: joi.string().allow("").optional(),
  salaryRange: joi.string().allow("").optional(),
  skills: joi.array().items(joi.string().trim()).optional(),
  applicants: joi.array().items(joi.string().hex().length(24)).optional(),
});

const updateJobValidation = joi.object({
  title: joi.string().trim().optional(),
  type: joi.string().optional(),
  description: joi.string().optional(),
  location: joi.string().optional(),
  salaryRange: joi.string().optional(),
  skills: joi.array().items(joi.string().trim()).optional(),
  applicants: joi.array().items(joi.string().hex().length(24)).optional(),
  experience: joi.number().min(0).optional(),
});

const createJob = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      title,
      type,
      description,
      location,
      salaryRange,
      skills,
      applicants,
      experience,
    } = req.body;

    const { error } = jobValidation.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const employer = await Employer.findOne({ authId: userId });

    if (!employer)
      return res.status(400).json({ message: "Employer profile not found" });

    const slug = title
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);

    const jobKeyTitle = `${slug}-${Date.now().toString(36)}`;

    const duplicates = await Job.findOne({
      employerId: employer._id,
      title: title,
    });

    if (duplicates)
      return res
        .status(400)
        .json({ message: "A job with this title already exists" });

    const newJob = await Job.create({
      title,
      type,
      description,
      location,
      salaryRange: salaryRange || "Not Disclosed",
      skills: skills || [],
      applicants: applicants || [],
      experience: experience ?? 0,
      employerId: employer._id,
      employerDetails: {
        companyName: employer.companyName,
        hrName: employer.hrName,
        hrEmail: employer.hrEmail,
        companySize: employer.companySize,
        industry: employer.industry,
      },
      jobKey: jobKeyTitle,
    });

    if (!newJob) return res.status(400).json({ message: "Job not Found" });

    await Employer.findOneAndUpdate(
      { authId: userId },
      {
        $addToSet: { jobPosted: newJob._id },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      job: {
        title: newJob.title,
        description: newJob.description,
        location: newJob.location,
        salaryRange: newJob.salaryRange,
        skills: newJob.skills,
        applicants: newJob.applicants,
        experience: newJob.experience,
        jobKey: newJob.jobKey,
        employerDetails: {
          companyName: employer.companyName,
          hrName: employer.hrName,
          hrEmail: employer.hrEmail,
          companySize: employer.companySize,
          industry: employer.industry,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update job

const updateJob = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const {
      title,
      type,
      description,
      location,
      salaryRange,
      skills,
      applicants,
      experience,
    } = req.body;

    const { id } = req.params;

    const { error } = updateJobValidation.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const employer = await Employer.findOne({ authId: userId });

    if (!employer)
      return res.status(404).json({ message: "Employer Not Found" });

    const duplicate = await Job.findOne({
      employerId: employer._id,
      _id: { $ne: id },
      title: title,
    });

    if (duplicate)
      return res.status(400).json({ message: "Job already present" });

    const job = await Job.findOneAndUpdate(
      { employerId: employer._id, _id: id },
      {
        $set: {
          title,
          type,
          description,
          location,
          salaryRange,
          skills,
          applicants,
          experience,
        },
      },
      { new: true, runValidators: true }
    );

    if (!job) return res.status(404).json({ message: "Job not Found" });
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    if (jobs.length === 0) return res.status(200).json([]);

    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({ jobKey: req.params.id });

    if (!job) return res.status(404).json({ message: "Job Not Found" });

    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteById = async (req, res) => {
  try {
    const userId = req.user_id || req.user.id;

    const { id } = req.params;

    const employer = await Employer.findOneAndUpdate(
      { authId: userId },
      { $pull: { jobPosted: { id } } }
    );

    if (!employer)
      return res
        .status(404)
        .json({ message: "Job is Not listed in the employer profile" });

    const employerJobById = await Job.findByIdAndDelete({ _id: id });

    if (!employerJobById)
      return res.status(404).json({ message: "Job not found" });

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getJobByEmployer = async (req, res) => {
  try {
    const employerId = req.params.id;

    const jobs = await Job.find({
      employerId: employerId,
    }).select("-employerDetails -employerId");

    if (jobs.length === 0) return res.status(200).json([]);

    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createJob,
  updateJob,
  getAllJobs,
  getJobById,
  deleteById,
  getJobByEmployer,
};
