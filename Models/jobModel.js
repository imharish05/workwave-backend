const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    type: [
      {
        type: String,
        enum: ["full-time", "part-time", "internship", "contract"],
        required: true,
        default: "full-time",
      },
    ],

    experience: {
      type: String, // e.g. "0-2 years", "3-5 years"
      trim: true,
    },

    location: {
      type: String,
      trim: true,
      lowercase: true,
    },

    salaryRange: {
      type: String, // e.g. "3-6 LPA"
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },

    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    jobKey: {
      type: String,
      unique: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", JobSchema);
