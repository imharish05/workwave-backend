const Employee = require("../Models/employeeModel.js");
const { cloudinary } = require("../Middlewares/resumeUpload.js");
const axios = require("axios");

const dotenv = require("dotenv");
const path = require("path");

const fs = require("fs");

const envPath = path.join(process.cwd(), "config", ".env");

dotenv.config({ path: envPath });

const joi = require("joi");

// Validation schema's

// profile schema
const profileSchema = joi.object({
  userName: joi.string().trim().optional(),
  phone: joi.string().trim().optional(),
  location: joi
    .object({
      country: joi.string().trim().optional(),
      street: joi.string().trim().optional(),
      cityState: joi.string().trim().optional(),
      area: joi.string().trim().optional(),
      pincode: joi.string().trim().optional(),
      relocation: joi.boolean().optional(),
    })
    .optional(),
});
// education schema

const educationSchema = joi.object({
  degree: joi.string().required(),
  course: joi.string().required(),
  educationId: joi.string().hex().length(24).optional(),
});

// Job schema
const jobSchema = joi.object({
  company: joi.string().required(),
  title: joi.string().required(),
  startDate: joi.date().required(),
  endDate: joi.date().required(),
  description: joi.string().required(),
  experienceId: joi.string().hex().length(24).optional(),
});

const jobPreferenceSchema = joi.object({
  jobTitle: joi.array().items(joi.string()).required(),
  preferredLocation: joi.array().items(joi.string()).required(),
  expectedSalary: joi
    .string()
    .valid("0-3 LPA", "3-6 LPA", "6-10 LPA", "10-20 LPA", "20+ LPA")
    .optional(),
  jobType: joi
    .array()
    .items(
      joi
        .string()
        .valid("full-time", "part-time", "internship", "contract", "freelance"),
    )
    .optional(),
  workAvailability: joi
    .array()
    .items(
      joi
        .string()
        .valid("monday-to-friday", "weekend-availability", "weekend-only"),
    )
    .required(),
  shiftPreference: joi
    .array()
    .items(
      joi
        .string()
        .valid(
          "day-shift",
          "morning-shift",
          "rotational-shift",
          "night-shift",
          "evening-shift",
          "fixed-shift",
          "us-shift",
          "uk-shift",
        ),
    )
    .required(),
  remote: joi.string().valid("remote", "hybrid", "onsite").optional(),
  preferenceId: joi.string().hex().length(24).optional(),
});

// Skill schema
const skillSchema = joi.object({
  name: joi.string().required(),
  experience: joi.string().allow("").optional(),
});

const certificationSchema = joi.object({
  name: joi.string().required(),
  expireYear: joi.date().allow(null).optional(),
  certificationId: joi.string().optional(),
});

// language schema
const languageSchema = joi.object({
  name: joi.string().required(),
  proficiency: joi
    .string()
    .valid("beginner", "intermediate", "expert", "fluent", "native")
    .allow("")
    .optional(),
  languageId: joi.string().hex().length(24).optional(),
});

// Set profile
const setProfile = async (req, res) => {
  try {
    const { userName, phone, location } = req.body;

    const { error } = profileSchema.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const updatedFields = { userName, phone };

    if (location) {
      updatedFields.location = {
        country: location.country,
        street: location.street,
        cityState: location.cityState,
        area: location.area,
        pincode: location.pincode,
        relocation: location.relocation,
      };
    }

    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      { $set: updatedFields },
      { new: true, runValidators: true, upsert: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile nor found" });

    const populated = await Employee.findOne({ authId: userId }).select(
      "location userName phone",
    );

    res.status(201).json({ employee: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userName, phone, location } = req.body;

    const { error } = profileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user._id || req.user.id;

    const updateData = {};

    if (userName !== undefined) updateData.userName = userName;
    if (phone !== undefined) updateData.phone = phone;

    if (location) {
      updateData.location = {
        country: location.country ?? null,
        street: location.street ?? null,
        cityState: location.cityState ?? null,
        area: location.area ?? null,
        pincode: location.pincode ?? null,
        relocation: location.relocation ?? false,
      };
    }

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("userName phone location");

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    res.status(200).json({ employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Get education
const getEducation = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOne({ authId: userId }).select(
      "education -_id",
    );

    if (!employee) return res.status(404).json({ message: "User Not Found" });

    res.status(200).json(employee);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

// Set Education
const addEducation = async (req, res) => {
  try {
    const { error, value } = educationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    let { degree, course } = value;

    degree = degree.trim().toLowerCase();
    course = course.trim().toLowerCase();

    const userId = req.user._id || req.user.id;

    const duplicate = await Employee.findOne({
      authId: userId,
      education: {
        $elemMatch: { degree, course },
      },
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Education already exists",
      });
    }

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      { $push: { education: { degree, course } } },
      { new: true },
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found",
      });
    }

    res.status(201).json({
      education: employee.education,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to add education",
    });
  }
};
// UpdateEducation
const editEducation = async (req, res) => {
  try {
    const { degree, course } = req.body || {};

    const { id } = req.params;

    const { error } = educationSchema.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const userId = req.user._id || req.user.id;

    const duplicates = await Employee.findOne({
      authId: userId,
      education: {
        $elemMatch: {
          course: course,
          degree: degree,
          _id: { $ne: id },
        },
      },
    });

    if (duplicates)
      return res
        .status(400)
        .json({ message: "You have already added this to your profile" });

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "education._id": id },
      {
        $set: {
          "education.$.degree": degree,
          "education.$.course": course,
        },
      },
      { new: true, runValidators: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; //PUT method

// Delete Education

const deleteEducation = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { id } = req.params;

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "education._id": id },
      { $pull: { education: { _id: id } } },
      { new: true },
    ).select("education -_id");

    if (!employee) return res.status(404).json({ message: "User Not Found" });

    res
      .status(200)
      .json({ message: "Education Deleted Successfully", employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload Resume - WITH DETAILED ERROR LOGGING

const setResume = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      console.error("ERROR: No user ID in request");
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check 2: File in request
    if (!req.file) {
      console.error("ERROR: No file in request");
      console.log("req.body:", req.body);
      console.log("req.files:", req.files);
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check 3: Cloudinary upload result
    if (!req.file.path) {
      console.error("ERROR: No Cloudinary path in file object");
      console.log("File object:", JSON.stringify(req.file, null, 2));
      return res.status(500).json({
        message: "Cloudinary upload failed - no path returned",
        details: "File was received but Cloudinary did not return a URL",
      });
    }

    // Check 4: Validate Cloudinary URL format
    if (!req.file.path.includes("cloudinary.com")) {
      return res.status(500).json({
        message: "Invalid Cloudinary URL",
        url: req.file.path,
      });
    }

    const employee = await Employee.findOne({ authId: userId });

    if (!employee) {
      console.error("ERROR: Employee not found in database");
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // Check 6: Delete old resume if exists
    if (employee.resume?.publicId) {
      console.log("Deleting old resume:", employee.resume.publicId);
      try {
        const deleteResult = await cloudinary.uploader.destroy(
          employee.resume.publicId,
          { resource_type: "raw", invalidate: true },
        );
        console.log("✓ Old resume deleted:", deleteResult.result);
      } catch (delError) {
        console.warn("Warning: Could not delete old resume:", delError.message);
        // Continue anyway - this is not critical
      }
    }

    // Check 7: Save new resume to database
    employee.resume = {
      filename: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
      resourceType: "raw",
      uploadDate: new Date(),
    };

    await employee.save();

    try {
      const testResponse = await axios.head(employee.resume.url, {
        timeout: 5000,
      });
      console.log("✓ URL is accessible, status:", testResponse.status);
    } catch (urlError) {
      console.error("WARNING: URL test failed:", urlError.message);
      console.log("URL may not be immediately accessible, but continuing...");
    }

    console.log("=== RESUME UPLOAD COMPLETE ===\n");

    res.status(200).json({
      filename: employee.resume.filename,
      url: employee.resume.url,
      uploadDate: employee.resume.uploadDate,
    });
  } catch (err) {
    // Check specific error types
    if (err.name === "ValidationError") {
      console.error("MongoDB Validation Error:", err.errors);
      return res.status(400).json({
        message: "Database validation error",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    if (err.name === "MongoError" || err.name === "MongoServerError") {
      console.error("MongoDB Error:", err.message);
      return res.status(500).json({
        message: "Database error",
        details: err.message,
      });
    }

    // Generic error response
    res.status(500).json({
      message: "Failed to upload resume",
      error: err.message,
      type: err.constructor.name,
    });
  }
};

// Download Resume - Buffer Method with Error Handling
const downloadResume = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const employee = await Employee.findOne({ authId: userId }).select(
      "resume -_id",
    );

    if (!employee || !employee.resume?.url) {
      console.log("No resume found for user:", userId);
      return res.status(404).json({ message: "Resume not found" });
    }

    // Fetch from Cloudinary
    const response = await axios({
      method: "GET",
      url: employee.resume.url,
      responseType: "stream",
      timeout: 30000, // 30 second timeout
    });

    const contentType =
      response.headers["content-type"] || "application/octet-stream";

    // Set response headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(employee.resume.filename)}"`,
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-cache");

    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    response.data.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream error occurred" });
      }
    });

    // Pipe the stream to response
    response.data.pipe(res);
  } catch (error) {
    console.error("\n=== DOWNLOAD ERROR ===");
    console.error("Error:", error.message);

    if (error.response) {
      console.error("Cloudinary response status:", error.response.status);
      console.error("Cloudinary response data:", error.response.data);
    }

    if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
    }

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to download file",
        message: error.message,
        code: error.code,
      });
    }
  }
};

// Get Resume metadata
const getResume = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const employee = await Employee.findOne({ authId: userId }).select(
      "resume -_id",
    );

    if (!employee) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.status(200).json(employee.resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Resume
const deleteResume = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const employee = await Employee.findOne({ authId: userId });

    if (!employee || !employee.resume?.publicId) {
      return res.status(404).json({ message: "Resume not found" });
    }

    console.log("Deleting resume:", employee.resume.publicId);

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(employee.resume.publicId, {
      resource_type: "raw",
      invalidate: true,
    });

    // Remove from database
    employee.resume = undefined;
    await employee.save();

    console.log("Resume deleted successfully");
    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: err.message });
  }
};
// Add and Update Work

const getJobExperience = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOne({ authId: userId }).select(
      "experience -_id",
    );

    if (!employee) return res.status(404).json({ message: "User Not Found" });

    res.status(200).json(employee);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

const setJobExperience = async (req, res) => {
  try {
    const { company, title, startDate, endDate, description } = req.body;

    const { error } = jobSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.user._id || req.user.id;

    const duplicates = await Employee.findOne({
      authId: userId,
      experience: {
        $elemMatch: {
          company,
          title,
        },
      },
    });

    if (duplicates)
      return res
        .status(400)
        .json({ message: "You have already added this to the profile" });

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      {
        $push: {
          experience: { company, title, startDate, endDate, description },
        },
      },
      { new: true, runValidators: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(201).json({ experience: employee.experience });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// EditJob

const editJobExperience = async (req, res) => {
  try {
    const { company, title, startDate, endDate, description } = req.body;

    const { id } = req.params;

    const { error } = jobSchema.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const userId = req.user._id || req.user.id;

    const duplicates = await Employee.findOne({
      authId: userId,
      experience: {
        $elemMatch: {
          company,
          title,
          _id: { $ne: id },
        },
      },
    });
    if (duplicates)
      return res
        .status(400)
        .json({ message: "You have already added this to the profile" });

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "experience._id": id },
      {
        $set: {
          "experience.$.company": company,
          "experience.$.title": title,
          "experience.$.startDate": startDate,
          "experience.$.endDate": endDate,
          "experience.$.description": description,
        },
      },
      { new: true, runValidators: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Employee Not Found" });

    res.status(200).json({ experience: employee.experience });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Job Experience

const deleteJobExperience = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { id } = req.params;

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "experience._id": id },
      { $pull: { experience: { _id: id } } },
      { new: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({
      message: "Job experience deleted successfully",
      experience: employee.experience,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get skills

const getSkills = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOne({ authId: userId }).select(
      "skills -_id",
    );

    if (!employee) return res.status(404).json({ message: "User Not Found" });

    res.status(200).json(employee);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

// Set Skills

const setSkills = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { name, experience } = req.body;

    const { error } = skillSchema.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const duplicates = await Employee.findOne({
      authId: userId,
      skills: { $elemMatch: { name: name } },
    });

    if (duplicates)
      return res.status(400).json({ message: "Skill already present" });

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      {
        $push: {
          skills: { name: name, experience: experience || "" },
        },
      },
      { new: true, runValidators: true },
    ).select("skills -_id");

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// editSkills

const editSkills = async (req, res) => {
  try {
    const { name, experience } = req.body;

    const { id } = req.params;

    if (!name)
      return res.status(400).json({ message: "Skill name is required" });

    const userId = req.user._id || req.user.id;

    const duplicates = await Employee.findOne({
      authId: userId,
      skills: { $elemMatch: { name: name, _id: { $ne: id } } },
    });

    if (duplicates)
      return res.status(400).json({ message: "Skill already present" });

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "skills._id": id },
      {
        $set: {
          "skills.$.name": name,
          "skills.$.experience": experience || "",
        },
      },
      { new: true, runValidators: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Skill entry not found" });

    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete skills
const deleteSkills = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "skills._id": id },
      {
        $pull: {
          skills: { _id: id },
        },
      },
      { new: true },
    ).select("skills -_id");

    if (!employee)
      return res.status(404).json({ message: "Skill entry not found" });

    res.status(200).json({ message: "Skill deleted successfully", employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// certifications

const getCertificates = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOne({ authId: userId }).select(
      "certifications -_id",
    );

    if (!employee) return res.status(404).json({ message: "User Not Found" });

    res.status(200).json(employee);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

const setCertifications = async (req, res) => {
  try {
    const { name, expireYear } = req.body;

    const userId = req.user._id || req.user.id;

    const { error } = certificationSchema.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const duplicates = await Employee.findOne({
      authId: userId,
      certifications: {
        $elemMatch: {
          name,
        },
      },
    });

    if (duplicates)
      return res
        .status(400)
        .json({ message: "You have already added this to your profile" });

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      {
        $push: {
          certifications: {
            name,
            expireYear,
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(200).json({
      certifications: employee.certifications,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit Certifications

const editCertificate = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { name, expireYear } = req.body;

    const { id } = req.params;

    const { error } = certificationSchema.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const duplicates = await Employee.findOne({
      authId: userId,
      certifications: {
        $elemMatch: {
          name: name,
          _id: { $ne: id },
        },
      },
    });

    if (duplicates)
      return res.status(400).json({ message: "Certification already Exist" });

    const employee = await Employee.findOneAndUpdate(
      {
        authId: userId,
        "certifications._id": id,
      },
      {
        $set: {
          "certifications.$.name": name,
          "certifications.$.expireYear": expireYear,
        },
      },
      { new: true, runValidators: true },
    );
    res.status(200).json({
      certifications: employee.certifications,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete certifications
const deleteCertificate = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { id } = req.params;

    const employee = await Employee.findOneAndUpdate(
      {
        authId: userId,
        "certifications._id": id,
      },
      {
        $pull: {
          certifications: { _id: id },
        },
      },
      { new: true },
    ).select("certifications -_id");

    if (!employee)
      return res.status(404).json({ message: "Employee Not Found" });

    res.status(200).json({
      certifications: employee.certifications,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get job

const getJobPreference = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOne({ authId: userId }).select(
      "jobPreferences -_id",
    );

    if (!employee) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json(employee);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

// Set job preferences
const setJobPreferences = async (req, res) => {
  try {
    const {
      jobTitle,
      preferredLocation,
      expectedSalary,
      jobType,
      workAvailability,
      shiftPreference,
      remote,
    } = req.body;

    const userId = req.user._id || req.user.id;

    const { error } = jobPreferenceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      {
        $set: {
          jobPreferences: {
            jobTitle,
            preferredLocation,
            expectedSalary: expectedSalary || "0-3 LPA",
            jobType: jobType || [],
            workAvailability,
            shiftPreference,
            remote: remote || "onsite",
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    res.status(200).json({ jobPreference: employee.jobPreferences });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit job preferences
const editJobPreferences = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const {
      jobTitle,
      preferredLocation,
      expectedSalary,
      jobType,
      workAvailability,
      shiftPreference,
      remote,
    } = req.body;

    const { id } = req.params;

    const { error } = jobPreferenceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "jobPreferences._id": id },
      {
        $set: {
          "jobPreferences.$.jobTitle": jobTitle,
          "jobPreferences.$.preferredLocation": preferredLocation,
          "jobPreferences.$.expectedSalary": expectedSalary || "0-3 LPA",
          "jobPreferences.$.jobType": jobType || [],
          "jobPreferences.$.workAvailability": workAvailability,
          "jobPreferences.$.shiftPreference": shiftPreference,
          "jobPreferences.$.remote": remote || "onsite",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    res.status(200).json({ jobPreference: employee.jobPreferences });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete job preferences
const deleteJobPreferences = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "jobPreferences._id": id },
      {
        $pull: {
          jobPreferences: { _id: id },
        },
      },
      { new: true },
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }
    res.status(200).json({
      message: "Job Preferences delete successfully",
      jobPreference: employee.jobPreferences,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// getLanguage

const getLanguage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOne({ authId: userId }).select(
      "languages -_id",
    );

    if (!employee) return res.status(404).json({ message: "User Not Found" });

    res.status(200).json(employee);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

const setLanguage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { name, proficiency } = req.body;

    const { error } = languageSchema.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const duplicates = await Employee.findOne({
      authId: userId,
      languages: {
        $elemMatch: {
          name,
        },
      },
    });

    if (duplicates)
      return res
        .status(400)
        .json({ message: "You have already added this to the profile" });

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      {
        $push: {
          languages: {
            name,
            proficiency,
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(201).json({ languages: employee.languages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit Language

const editLanguage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { name, proficiency } = req.body;

    const { id } = req.params;

    const { error } = languageSchema.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const duplicates = await Employee.findOne({
      authId: userId,
      languages: {
        $elemMatch: {
          name: name,
          _id: { $ne: id },
        },
      },
    });

    if (duplicates)
      return res
        .status(400)
        .json({ message: "You have already added this to your profile" });

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "languages._id": id },
      {
        $set: {
          "languages.$.name": name,
          "languages.$.proficiency": proficiency,
        },
      },
      { new: true, runValidators: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(200).json({ languages: employee.languages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Language
const deleteLanguage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const { id } = req.params;

    const employee = await Employee.findOneAndUpdate(
      { authId: userId, "languages._id": id },
      {
        $pull: {
          languages: { _id: id },
        },
      },
      { new: true },
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(200).json({
      message: "Language deleted successfully",
      languages: employee.languages,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOne({ authId: userId })
      .populate("authId", "email role provider")
      .populate({
        path: "appliedJobs",
        select: "title location salaryRange type employerDetails createdAt",
      });
    if (!employee) return res.status(404).json({ message: "User Not Found" });
    res.status(200).json(employee);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};


const getAppliedJobs = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOne(
      { authId: userId },
      { appliedJobs: 1, _id: 0 },
    ).populate({
      path: "appliedJobs",
      select: "title location salaryRange type jobKey createdAt",
    });

    if (!employee) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json(employee.appliedJobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  updateProfile,
  getProfile,
  setProfile,
  addEducation,
  getEducation,
  editEducation,
  deleteEducation,
  getJobExperience,
  setJobExperience,
  editJobExperience,
  deleteJobExperience,
  getSkills,
  setSkills,
  editSkills,
  deleteSkills,
  getCertificates,
  setCertifications,
  editCertificate,
  deleteCertificate,
  getJobPreference,
  setJobPreferences,
  editJobPreferences,
  deleteJobPreferences,
  getLanguage,
  setLanguage,
  editLanguage,
  deleteLanguage,
  getResume,
  setResume,
  downloadResume,
  deleteResume,
  getAppliedJobs,
};
