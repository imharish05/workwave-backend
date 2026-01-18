const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { fileTypeFromFile } = require("file-type");

const uploadDir = path.join(__dirname, "../uploads/resumes");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = file.originalname.replace(/\s/g, "-");
    cb(null, unique);
  },
});

const allowedExt = ["pdf", "doc", "docx"];
const allowedMime = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];


function fileFilter(req, file, cb) {
  const ext = file.originalname.split(".").pop().toLowerCase();
  
  if (!allowedExt.includes(ext) || !allowedMime.includes(file.mimetype) ) {
    return cb(new Error("Only PDF, DOC, DOCX allowed"), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = { upload };
