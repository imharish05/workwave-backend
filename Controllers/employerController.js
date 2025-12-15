const Employer = require("../Models/employerModel.js");

const Joi = require("joi");
const mongoose = require("mongoose");

const employerValidation = Joi.object({
  userName: Joi.string().trim().optional(),

  authId: Joi.string()
    .custom((value, helper) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helper.message("Invalid authId");
      }
      return true;
    })
    .optional(),

  companyName: Joi.string().allow(""),
  industry: Joi.string().allow(""),
  companySize: Joi.string().allow(""),
  website: Joi.string().uri().allow(""),

  location: Joi.object({
    country: Joi.string().allow(""),
    cityState: Joi.string().allow(""),
    street: Joi.string().allow(""),
    area: Joi.string().allow(""),
    pincode: Joi.number().allow(""),
  }).optional(),

  description: Joi.string().allow(""),
  hrName: Joi.string().allow(""),
  hrPhone: Joi.string().allow(""),
  hrEmail: Joi.string().email().allow(""),
  jobPosted: Joi.array().items(Joi.object()).optional(),
});

const newEmployer = async (req, res) => {
  try {
    const { error } = employerValidation.validate(req.body);

    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const userId = req.user._id || req.user.id;
    const {
      companyName,
      industry,
      companySize,
      website,
      country,
      cityState,
      street,
      area,
      pincode,
      description,
      hrName,
      hrPhone,
      hrEmail,
    } = req.body;

    const employer = await Employer.findOneAndUpdate(
      { authId: userId },
      {
        $set: {
          authId: userId,
          companyName,
          industry,
          companySize,
          website,
          location: {
            country,
            cityState,
            street,
            area,
            pincode,
          },
          description,
          hrName,
          hrPhone,
          hrEmail,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    if (!employer)
      return res.status(400).json({ message: "Employer Not Found" });

    const populated = await Employer.findOne({ _id: employer._id }).populate(
      "jobPosted authId",
      "-employerDetails -employerDetails -password"
    );

    res.status(201).json({ employer: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const deleteEmployer = async(req,res)=>{
  try{
    const userId = req.user._id || req.user.id

    const employer = await Employer.findOneAndDelete({"authId" : userId})

    if(!employer) return res.status(404).json({message : "Unable to delete"})

      res.status(200).json({message : "User profile deleted successfully"})
  }
  catch(err){
    res.status(500).json({message : err.message})
  }
}

module.exports = {newEmployer,deleteEmployer};
