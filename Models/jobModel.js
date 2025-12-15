const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    type: {type : String,enum :["Full Time","Part Time","Internship"], default : "Full Time"},
    experience: {type : Number,default : 0},
    location: String,
    salaryRange: String,
    skills: [String],
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    employerDetails: {
      companyName: String,
      hrName: String,
      hrEmail: String,
      companySize: String,
      industry: String,
    },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    jobKey: { type: String, unique: true },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", JobSchema);

module.exports = Job;
