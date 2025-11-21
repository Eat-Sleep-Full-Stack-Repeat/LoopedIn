const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const { pool } = require("../backend_connection");
const authenticateToken = require("../middleware/authenticate");
const { uploadFile } = require("../s3_connection");

require("dotenv").config();

/**
 * Multer setup: memory storage, 5MB max per file
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error("Unsupported file type. Use jpg, png, webp, or gif.")
      );
    }
    cb(null, true);
  },
});

/**
 * POST /api/post
 *
 * multipart/form-data:
 *   caption   : string
 *   isPublic  : "true" | "false"
 *   tags      : JSON string array of tag strings (["beginner","crochet"])
 *   altTexts  : JSON string array of alt texts (one per photo card)
 *   craft     : "Crochet" | "Knit" (currently just stored as text, if you later add a column)
 *   photos    : up to 5 image files (field name "photos")
 */
router.post(
  "/post",
  authenticateToken,
  upload.array("photos", 5),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const userPk = req.userID?.trim?.() || req.userID;

      const { caption = "", isPublic = "true", tags, altTexts, craft } =
        req.body || {};

      if (!userPk) {
        return res
          .status(401)
          .json({ error: "Missing user id from auth token" });
      }

      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one photo is required" });
      }

      let tagArray = [];
      let altArray = [];

      try {
        if (tags) {
          tagArray = JSON.parse(tags);
        }
      } catch (e) {
        console.error("Failed to parse tags JSON:", tags, e);
      }

      try {
        if (altTexts) {
          altArray = JSON.parse(altTexts);
        }
      } catch (e) {
        console.error("Failed to parse altTexts JSON:", altTexts, e);
      }

      console.log("[POST /post] user:", userPk);
      console.log("[POST /post] caption:", caption);
      console.log("[POST /post] isPublic:", isPublic);
      console.log("[POST /post] craft:", craft);
      console.log("[POST /post] tags:", tagArray);
      console.log("[POST /post] files:", req.files.length);

      await client.query("BEGIN");

      // 1) Insert the post into posts.tbl_post
      const insertPostSql = `
        INSERT INTO posts.tbl_post
          (fld_creator, fld_caption, fld_is_public)
        VALUES
          ($1, $2, $3)
        RETURNING fld_post_pk AS "postId"
      `;
      const postResult = await client.query(insertPostSql, [
        userPk,
        caption || "",
        isPublic === "true",
      ]);
      const postId = postResult.rows[0].postId;

      // 2) Upload each image to S3 and insert into posts.tbl_post_pic
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];

        const originalExt = path.extname(file.originalname) || ".jpg";
        const randomName = crypto.randomBytes(16).toString("hex");
        const fileName = `${postId}_${randomName}_${i}${originalExt}`;
        const folderName = "posts"; // S3 folder

        console.log(
          `[POST /post] uploading file ${i} => ${folderName}/${fileName}`
        );
        await uploadFile(
          file.buffer,
          fileName,
          folderName,
          file.mimetype
        );

        const s3Key = `${folderName}/${fileName}`;
        const altText =
          Array.isArray(altArray) && altArray[i] ? altArray[i] : "";

        const insertPicSql = `
          INSERT INTO posts.tbl_post_pic
            (fld_post_fk, fld_post_pic, fld_alt_text)
          VALUES
            ($1, $2, $3)
        `;
        await client.query(insertPicSql, [postId, s3Key, altText]);
      }

      // 3) Map string tags -> tag IDs in tags.tbl_tags, then link in posts.tbl_post_tag
      if (Array.isArray(tagArray) && tagArray.length > 0) {
        // Clean and normalize tag names
        const cleanTags = tagArray
          .map((t) => (t || "").trim())
          .filter((t) => t.length > 0);

        if (cleanTags.length > 0) {
          const lowerNames = cleanTags.map((t) => t.toLowerCase());

          // Fetch any existing tags with these names
          const existingRes = await client.query(
            `
            SELECT fld_tags_pk, fld_tag_name
            FROM tags.tbl_tags
            WHERE LOWER(fld_tag_name) = ANY($1)
          `,
            [lowerNames]
          );

          const existingMap = new Map();
          for (const row of existingRes.rows) {
            existingMap.set(row.fld_tag_name.toLowerCase(), row.fld_tags_pk);
          }

          const tagIds = [];

          for (const tagName of cleanTags) {
            const key = tagName.toLowerCase();
            let tagId = existingMap.get(key);

            if (!tagId) {
              // Create new tag with a default color
              const defaultColor = "#7700ff";
              const insertTagRes = await client.query(
                `
                INSERT INTO tags.tbl_tags
                  (fld_tag_name, fld_tag_color)
                VALUES
                  ($1, $2)
                RETURNING fld_tags_pk
              `,
                [tagName, defaultColor]
              );
              tagId = insertTagRes.rows[0].fld_tags_pk;
              existingMap.set(key, tagId);
            }

            tagIds.push(tagId);
          }

          // Insert into posts.tbl_post_tag (postId, tagId) – avoid duplicates
          const insertPostTagSql = `
            INSERT INTO posts.tbl_post_tag
              (fld_post, fld_tag)
            VALUES
              ($1, $2)
            ON CONFLICT DO NOTHING
          `;

          for (const tagId of tagIds) {
            try {
              await client.query(insertPostTagSql, [postId, tagId]);
            } catch (e) {
              console.error(
                "[POST /post] tag-post link insert failed:",
                e
              );
            }
          }
        }
      }

      await client.query("COMMIT");

      return res.status(201).json({
        postId,
        message: "Post created successfully",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("POST /post error:", err);
      return res.status(500).json({ error: "Internal server error" });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
