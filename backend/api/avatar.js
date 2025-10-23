const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const authenticateToken = require("../middleware/authenticate");
const { uploadFile, getSignedFile } = require("../s3_connection");

require("dotenv").config();

//Multer setup (use memory storage so files go straight to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type. Use jpg, png, webp, or gif."));
    }
    cb(null, true);
  },
});

router.post(
  "/profile/avatar",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded. Field name: 'file'" });
      }

      const userPk = req.userID?.trim?.() || req.userID;
      const folderName = "avatars";

      // Determine file extension and name
      const ext =
        {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        }[req.file.mimetype] ||
        path.extname(req.file.originalname || "").replace(/^\./, "") ||
        "jpg";

      // Example: 1234-1739990000-abc123.jpg
      const fileName = `${userPk}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

      // Upload to S3
      await uploadFile(req.file.buffer, fileName, folderName, req.file.mimetype);

      // Generate a signed URL valid for 12 hours 
      const signedUrl = await getSignedFile(folderName, fileName);

      // Respond with the signed URL
      return res.status(200).json({
        avatarUrl: signedUrl,
        message: "Avatar uploaded successfully",
      });
    } catch (err) {
      console.error("Error uploading avatar:", err);
      return res.status(500).json({
        error: err?.message || "Internal server error during avatar upload",
      });
    }
  }
);

module.exports = router;
