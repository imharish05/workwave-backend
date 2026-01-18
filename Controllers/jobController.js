const Job = require("../Models/jobModel");
const Employer = require("../Models/employerModel");
const Employee = require("../Models/employeeModel");
const Joi = require("joi");

const jobValidation = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().allow("").optional(),
  type: Joi.array()
    .items(
      Joi.string().valid("full-time", "part-time", "internship", "contract"),
    )
    .min(1)
    .required(),
  experience: Joi.string().optional(),
  location: Joi.string().allow("").optional(),
  salaryRange: Joi.string().allow("").optional(),
  skills: Joi.array().items(Joi.string().trim()).optional(),
});

const updateJobValidation = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().allow("").optional(),
  type: Joi.array()
    .items(
      Joi.string().valid("full-time", "part-time", "internship", "contract"),
    )
    .min(1)
    .required(),
  experience: Joi.string().optional(),
  location: Joi.string().allow("").optional(),
  salaryRange: Joi.string().allow("").optional(),
  skills: Joi.array().items(Joi.string().trim()).optional(),
});

const getFullEmployer = async (authId) => {
  return Employer.findOne({ authId }).populate({
    path: "jobPosted",
    options: { sort: { createdAt: -1 } },
  });
};

const createJob = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { error } = jobValidation.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const employer = await Employer.findOne({ authId: userId });
    if (!employer)
      return res.status(404).json({ message: "Employer profile not found" });

    const {
      title,
      type,
      description,
      location,
      salaryRange,
      skills,
      experience,
    } = req.body;

    const duplicate = await Job.findOne({
      employerId: employer._id,
      title: title.trim().toLowerCase(),
    });

    if (duplicate)
      return res.status(400).json({ message: "Job already exists" });

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    const jobKey = `${slug}-${Date.now().toString(36)}`;

    const job = await Job.create({
      title: title.trim().toLowerCase(),
      type,
      description,
      location,
      salaryRange: salaryRange || "Not Disclosed",
      skills: skills || [],
      experience,
      employerId: employer._id,
      jobKey,
    });

    await Employer.updateOne(
      { _id: employer._id },
      { $addToSet: { jobPosted: job._id } },
    );

    const fullEmployer = await getFullEmployer(userId);

    res.status(201).json({ employer: fullEmployer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update job

const updateJob = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const { error } = updateJobValidation.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const employer = await Employer.findOne({ authId: userId });
    if (!employer)
      return res.status(404).json({ message: "Employer not found" });

    if (req.body.title) {
      const duplicate = await Job.findOne({
        employerId: employer._id,
        _id: { $ne: id },
        title: req.body.title.trim().toLowerCase(),
      });

      if (duplicate)
        return res.status(400).json({ message: "Duplicate job title" });
    }

    const job = await Job.findOneAndUpdate(
      { _id: id, employerId: employer._id },
      { $set: req.body },
      { new: true },
    );

    if (!job) return res.status(404).json({ message: "Job not found" });

    const fullEmployer = await getFullEmployer(userId);

    res.status(200).json({ employer: fullEmployer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate({
        path: "employerId",
        select: "companyName companyLogo location website",
      })
      .sort({ createdAt: -1 })
      .select(
        "title description type experience location salaryRange skills applicants jobKey isActive",
      );

    const response = jobs.map((job) => ({
      ...job.toObject(),
      applicantsCount: job.applicants.length,
      applicants: undefined,
    }));

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getJobByKey = async (req, res) => {
  try {
    const job = await Job.findOne({ jobKey: req.params.id });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const employer = await Employer.findOne({ authId: userId });
    if (!employer)
      return res.status(404).json({ message: "Employer not found" });

    const job = await Job.findOneAndDelete({
      _id: id,
      employerId: employer._id,
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    await Employer.updateOne(
      { _id: employer._id },
      { $pull: { jobPosted: id } },
    );

    const fullEmployer = await getFullEmployer(userId);

    res.status(200).json({ employer: fullEmployer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getJobByEmployer = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employer = await Employer.findOne({ authId: userId });
    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    const jobs = await Job.find({ employerId: employer._id })
      .select("-employerId -__v")
      .populate({
        path: "applicants",
        select: "-_id -appliedJobs -__v",
        populate: {
          path: "authId",
          select: "email -_id",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const applyJob = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { id } = req.params;

    const employee = await Employee.findOne({ authId: userId });
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    if (employee.appliedJobs.includes(id)) {
      return res
        .status(400)
        .json({ message: "You have already applied to this job" });
    }

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    await Job.findByIdAndUpdate(id, {
      $addToSet: { applicants: employee._id },
    });

    await Employee.findOneAndUpdate(
      { authId: userId },
      { $addToSet: { appliedJobs: id } },
    );

    res.status(200).json({ message: "Applied successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createJob,
  updateJob,
  getAllJobs,
  getJobByKey,
  deleteJob,
  applyJob,
  getJobByEmployer,
};
