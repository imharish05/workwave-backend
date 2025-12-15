const mongoose = require("mongoose");

const employerSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    companyName: { type: String },
    industry: { type: String },
    companySize: { type: String },
    website: { type: String },
    location: {
      country: String,
      cityState: String,
      street: String,
      area: String,
      pincode: Number,
    },
    description: String,
    hrName: String,
    hrPhone: String,
    hrEmail: String,
    jobPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  },
  { timestamps: true }
);

const Employer = mongoose.model("Employer", employerSchema);

module.exports = Employer;
