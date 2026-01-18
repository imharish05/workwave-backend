const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    authId: { type: mongoose.Schema.ObjectId, ref: "Auth", required: true },
    userName: { type: String },
    phone: String,
    location: {
      country: String,
      street: String,
      cityState: String,
      area: String,
      pincode: String,
      relocation: Boolean,
    },
    education: [{ degree: String, course: String }],
    experience: [
      {
        company: String,
        title: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],
    skills: [{ name: String, experience: String }],
    resumeUrl: String,
    jobPreferences: [
      {
        jobTitle: [String],
        preferredLocation: [String],
        expectedSalary: {
          type: String,
          enum: ["0-3 LPA", "3-6 LPA", "6-10 LPA", "10-20 LPA", "20+ LPA"],
          default: "0-3 LPA",
        },
        jobType: [
          {
            type: String,
            enum: [
              "full-time",
              "part-time",
              "internship",
              "contract",
              "freelance",
            ],
          },
        ],
        workAvailability: {
          type: [String],
          enum: ["monday-to-friday", "weekend-availability", "weekend-only"],
          required: true,
        },
        shiftPreference: {
          type: [String],
          enum: [
            "day-shift",
            "morning-shift",
            "rotational-shift",
            "night-shift",
            "evening-shift",
            "fixed-shift",
            "us-shift",
            "uk-shift",
          ],
          required: true,
        },
        remote: { type: String, enum: ["remote", "hybrid", "onsite"] },
      },
    ],
    certifications: [
      {
        name: String,
        expireYear: String,
      },
    ],
    languages: [
      {
        name: String,
        proficiency: {
          type: String,
          enum: ["beginner", "intermediate", "expert", "fluent", "native"],
        },
      },
    ],
    appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
