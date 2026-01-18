const Employer = require("../Models/employerModel.js");
const Joi = require("joi");
const mongoose = require("mongoose");

/* -------------------------------------------------------------------------- */
/*                              VALIDATIONS                                   */
/* -------------------------------------------------------------------------- */

const locationSchema = Joi.object({
  country: Joi.string().allow(""),
  cityState: Joi.string().allow(""),
  street: Joi.string().allow(""),
  area: Joi.string().allow(""),
  pincode: Joi.number().allow(""),
});

const hrSchema = Joi.object({
  hrName: Joi.string().allow(""),
  hrPhone: Joi.string().allow(""),
  hrEmail: Joi.string().email().allow(""),
});

const descriptionSchema = Joi.object({
  description: Joi.string().allow(""),
});

/* -------------------------------------------------------------------------- */
/*                       CREATE / FULL UPDATE (UPSERT)                         */
/* -------------------------------------------------------------------------- */

const newEmployer = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employer = await Employer.findOneAndUpdate(
      { authId: userId },
      {
        $set: {
          authId: userId,
          ...req.body,
        },
      },
      { new: true, upsert: true },
    );

    res.status(201).json({ employer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmployer = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employer = await Employer.findOne({ authId: userId }).populate({
      path: "jobPosted",
      select: "-employerDetails -employerId",
      populate: {
        path: "applicants",
        select: "-appliedJobs -_id",
        populate: {
          path: "authId",
          select: "email",
        },
      },
    });

    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({ employer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteEmployer = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employer = await Employer.findOneAndDelete({
      authId: userId,
    });

    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({ message: "Employer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateEmployerLocation = async (req, res) => {
  const { error } = locationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const userId = req.user._id || req.user.id;

  try {
    const employer = await Employer.findOneAndUpdate(
      { authId: userId },
      { $set: { location: req.body } },
      { new: true },
    );

    res.status(200).json({ employer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateEmployerHR = async (req, res) => {
  const { error } = hrSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const userId = req.user._id || req.user.id;

  try {
    const employer = await Employer.findOneAndUpdate(
      { authId: userId },
      { $set: req.body },
      { new: true },
    );

    res.status(200).json({ employer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateEmployerDescription = async (req, res) => {
  const { error } = descriptionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const userId = req.user._id || req.user.id;

  try {
    const employer = await Employer.findOneAndUpdate(
      { authId: userId },
      { $set: { description: req.body.description } },
      { new: true },
    );

    res.status(200).json({ employer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------------------------------------------------------- */

module.exports = {
  newEmployer,
  getEmployer,
  deleteEmployer,
  updateEmployerLocation,
  updateEmployerHR,
  updateEmployerDescription,
};
