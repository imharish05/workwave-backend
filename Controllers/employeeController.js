const Auth = require("../Models/authModel.js");
const Employee = require("../Models/employeeModel.js");
const Employer = require("../Models/employerModel.js");

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
        .valid("full-time", "part-time", "internship", "contract", "freelance")
    )
    .optional(),
  workAvailability: joi
    .array()
    .items(
      joi
        .string()
        .valid("monday-to-friday", "weekend-availability", "weekend-only")
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
          "uk-shift"
        )
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
  expireYear: joi.string().allow("").optional(),
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
      { new: true, runValidators: true, upsert: true }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile nor found" });

    const populated = await Employee.findOne({ authId: userId }).populate(
      "authId",
      "-password"
    );

    res.status(201).json({ employee: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Set Education
const addEducation = async (req, res) => {
  try {
    const { degree, course } = req.body;

    const { error } = educationSchema.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const userId = req.user._id || req.user.id;

    const duplicates = await Employee.findOne({
      authId: userId,
      education: { $elemMatch: { degree, course } },
    });

    if (duplicates)
      return res
        .status(400)
        .json({ message: "You have already add this to your profile" });

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      { $push: { education: { degree, course } } },
      { new: true, runValidators: true }
    ).select("-_id -authId");

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UpdateEducation
const editEducation = async (req, res) => {
  try {
    const { degree, course } = req.body;

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
      { new: true, runValidators: true }
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
      {new : true}
    );

    if(!employee) return res.status(404).json({message : "User Not Found"})

    res.status(200).json({message : "Education Deleted Successfully"})

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// set Resume

const setResume = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = `${process.env.BASE_URL}/uploads/resumes/${req.file.filename}`;

    const employeeId = await Employee.findOne({ authId: userId });

    if (employeeId.resumeUrl) {
      const fileName = path.basename(employeeId.resumeUrl);
      const filePath = path.join(__dirname, "../uploads/resumes", fileName);
      if (fs.existsSync(filePath)) {
        await fs.unlinkSync(filePath);
      }
    }

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      { $set: { resumeUrl: filePath } },
      { new: true }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ filePath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE RESUME
const deleteResume = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employeeId = await Employee.findOne({ authId: userId });

    const fileName = path.basename(employeeId.resumeUrl);

    const filePath = path.join(__dirname, "../uploads/resumes", fileName);

    if (fs.existsSync(filePath)) {
      await fs.unlinkSync(filePath);
    }

    const employee = await Employee.findOneAndUpdate(
      { authId: userId },
      { $unset: { resumeUrl: "" } },
      { new: true }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add and Update Work

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
      { new: true, runValidators: true }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(201).json(employee);
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
      { new: true, runValidators: true }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee Not Found" });

    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Job Experience

const deleteJobExperience = async(req,res) =>{
  try{
    const userId = req.user._id || req.user.id

    const {id} = req.params

    const employee = await Employee.findOneAndUpdate(
      {authId : userId , "experience._id" : id},
      {$pull : {experience : {_id : id}}},
      {new : true}
    )

    if(!employee) return res.status(404).json({message : "Employee not found"}) 

      res.status(200).json({message : "Job experience deleted successfully"})

  }
  catch(err){
    res.status(500).json({message : err.message})
  }
}

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
      { new: true, runValidators: true }
    );

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
    const { skillId, name, experience } = req.body;

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
      { new: true, runValidators: true }
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
          skills : {_id : id}
        },
      },
      { new: true}
    );

    if (!employee)
      return res.status(404).json({ message: "Skill entry not found" });

    res.status(200).json({message : "Skill deleted successfully"});
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// certifications

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
      { new: true, runValidators: true }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(201).json(employee);
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
      { new: true, runValidators: true }
    );
    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete certifications
const deleteCertificate = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    console.log(req.params.id)

    const { id } = req.params;

    const employee = await Employee.findOneAndUpdate(
      {
        authId: userId,
        "certifications._id": id,
      },
      {
        $pull: {
          certifications : {_id : id}
        },
      },
      { new: true}
    );

    if(!employee) return res.status(404).json({message : "Employee Not Found"})

    res.status(200).json({message : "Certification Deleted Successfully"});

  } catch (err) {
    res.status(500).json({ message: err.message });
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
      return res.status(400).json({ message: error.details[0].message });
    }

    // Update employee's job preferences
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
      { new: true, runValidators: true }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit Job preferences
const editJobPreferences = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      preferenceId,
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
      return res.status(400).json({ message: error.details[0].message });
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
      { new: true, runValidators: true }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(200).json(employee);
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
          jobPreferences : {_id : id}
        },
      },
      { new: true}
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(200).json({message : "Job Preferences delete successfully"});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// setLanguage

const setLanguage = async (req, res) => {
  try {
    const { name, proficiency } = req.body;

    const userId = req.user._id || req.user.id;

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
      }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(201).json(employee);
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
      }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(200).json(employee);
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
          languages : {_id : id}
        },
      }
    );

    if (!employee)
      return res.status(404).json({ message: "Employee profile not found" });

    res.status(200).json({message : "Language deleted successfully"});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const employee = await Employee.findOne({ authId: userId }).populate(
      "authId",
      "email role provider"
    );
    if (!employee) return res.status(404).json({ message: "User Not Found" });
    res.status(200).json(employee);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

module.exports = {
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
};
