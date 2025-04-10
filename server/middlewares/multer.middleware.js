import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Corrected folder path to: E:\Projects\LMS\server\uploads
const uploadDir = path.resolve("server/server/uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // recursive in case 'server/' is also missing
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    ext !== ".pdf" &&
    ext !== ".jpeg" &&
    ext !== ".jpg" &&
    ext !== ".webp" &&
    ext !== ".png" &&
    ext !== ".mp4"
  ) {
    cb(new Error(`Unsupported file type! ${ext}`), false);
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

export default upload;
