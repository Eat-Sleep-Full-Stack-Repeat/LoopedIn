const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { pool } = require("../backend_connection");
const authenticateToken = require("../middleware/authenticate");
const { uploadFile, deleteFile, getSignedFile } = require("../s3_connection");

require("dotenv").config();

// Helper to safely split avatar keys
function splitAvatarKey(rawKey) {
  if (!rawKey) return null;
  const fullKey = rawKey.includes("/") ? rawKey : `avatars/${rawKey}`;
  const folderName = fullKey.split("/")[0];
  const fileName = fullKey.split("/").slice(1).join("/");
  return { folderName, fileName, fullKey };
}

// Multer setup (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
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
        return res
          .status(400)
          .json({ error: "No file uploaded. Field name: 'file'" });
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

      const fileName = `${userPk}-${Date.now()}-${crypto
        .randomBytes(6)
        .toString("hex")}.${ext}`;

      console.log(`[avatar upload] user ${userPk} uploading ${fileName}`);

      await uploadFile(req.file.buffer, fileName, folderName, req.file.mimetype);
      console.log(`[avatar upload] uploaded ${folderName}/${fileName} to S3`);

      // Fetch old key
      const oldRes = await pool.query(
        `SELECT fld_profile_pic AS "avatarKey" FROM login.tbl_user WHERE fld_user_pk = $1`,
        [userPk]
      );
      const oldKey = oldRes.rows[0]?.avatarKey || null;
      console.log(`[avatar cleanup] previous key:`, oldKey);

      // Update DB to new key
      await pool.query(
        `UPDATE login.tbl_user SET fld_profile_pic = $1 WHERE fld_user_pk = $2`,
        [`${folderName}/${fileName}`, userPk]
      );

      console.log(`[avatar upload] DB updated to ${folderName}/${fileName}`);

      // ✅ Safe delete old avatar
      if (oldKey && oldKey !== `${folderName}/${fileName}`) {
        const oldParts = splitAvatarKey(oldKey);
        if (!oldParts?.fileName) {
          console.log(`[avatar cleanup] malformed old key, skipping:`, oldKey);
        } else {
          console.log(
            `[avatar cleanup] attempting delete of ${oldParts.folderName}/${oldParts.fileName}`
          );
          await deleteFile(oldParts.fileName, oldParts.folderName)
            .then(() =>
              console.log(
                `[avatar cleanup] deleted old avatar ${oldParts.folderName}/${oldParts.fileName}`
              )
            )
            .catch((err) =>
              console.error(
                `[avatar cleanup] failed to delete ${oldParts.fullKey}:`,
                err
              )
            );
        }
      } else {
        console.log("[avatar cleanup] no old avatar to delete or same key reused");
      }
      
      // Generate signed URL
      const signedUrl = await getSignedFile(folderName, fileName);

      return res.status(200).json({
        avatarUrl: signedUrl,
        avatarKey: `${folderName}/${fileName}`,
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
