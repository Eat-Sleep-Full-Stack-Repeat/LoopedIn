const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const { pool } = require("../backend_connection");
const authenticateToken = require("../middleware/authenticate");
const { uploadFile } = require("../s3_connection");

const { generateColor } = require("../functions/color_generator");

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

      //added timestamps because that wasn't inserted before
      const now = new Date();
      const date = now.toISOString();
      console.log(date)

      // 1) Insert the post into posts.tbl_post
      const insertPostSql = `
        INSERT INTO posts.tbl_post
          (fld_creator, fld_caption, fld_is_public, fld_timestamp)
        VALUES
          ($1, $2, $3, $4)
        RETURNING fld_post_pk AS "postId"
      `;
      const postResult = await client.query(insertPostSql, [
        userPk,
        caption || "",
        isPublic === "true",
        date,
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

      //ADDED THIS BECAUSE THIS WAS NOT ADDED BEFORE -> INSERTING CRAFT FILTERS
      //get craft filter id
      query = `
      SELECT fld_tags_pk
      FROM tags.tbl_tags
      WHERE fld_tag_name = $1;
      `
      const filterResult = await client.query(query, [craft.trim()]);
      const filterID = filterResult.rows[0].fld_tags_pk

      //INSERT CRAFT FILTER
      query = `
      INSERT INTO posts.tbl_post_tag(fld_post, fld_tag)
      VALUES ($1, $2)
      ON CONFLICT (fld_post, fld_tag) DO NOTHING;
      `
      await client.query(query, [postId, filterID]);


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
              // CALLED OUR COLOR FUNCTION
              const defaultColor = generateColor();
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


//fetch public posts -> infinite scroll
router.get("/post", authenticateToken, async (req, res) => {
  try {
    //declare variables
    const curr_user = req.userID.trim()
    const limit = req.query.limit
    let morePosts = true
    let returnFeed

    let craftFilter = req.query.craft

    //fetch data if feed wasn't populated before
    //selects 10 public posts with their post recently added image, where their tags fulfill the craft filter
    if (req.query.before = "undefined" || !req.query.before) {
      query = `
      SELECT DISTINCT ON (p.fld_post_pk) u.fld_user_pk, p.fld_post_pk, u.fld_username, u.fld_profile_pic, p.fld_caption, CAST(p.fld_timestamp AS TIMESTAMPTZ), i.fld_pic_id, i.fld_post_pic
      FROM login.tbl_user AS u INNER JOIN posts.tbl_post AS p
        ON u.fld_user_pk = p.fld_creator
        INNER JOIN posts.tbl_post_pic AS i
          ON i.fld_post_fk = p.fld_post_pk
          INNER JOIN posts.tbl_post_tag AS tp
            ON tp.fld_post = p.fld_post_pk
            INNER JOIN tags.tbl_tags AS t
              ON t.fld_tags_pk = tp.fld_tag
      WHERE p.fld_is_public = true AND t.fld_tag_name = ANY($1) AND u.fld_user_pk <> $2
      ORDER BY p.fld_post_pk DESC, p.fld_timestamp DESC, i.fld_post_fk DESC
      LIMIT ($3 + 1);
      `

      returnFeed = await pool.query(query, ["{" + craftFilter.join(",") + "}", curr_user, limit])

    }
    else {
      //fetch data if feed was previously populated
      //mad lad query right here
      //also selects 10 public posts with their post recently added image, where their tags fulfill the craft filter
      query = `
      SELECT DISTINCT ON (p.fld_post_pk) u.fld_user_pk, p.fld_post_pk, u.fld_username, u.fld_profile_pic, p.fld_caption, CAST(p.fld_timestamp AS TIMESTAMPTZ), i.fld_pic_id, i.fld_post_pic
      FROM login.tbl_user AS u INNER JOIN posts.tbl_post AS p
        ON u.fld_user_pk = p.fld_creator
        INNER JOIN posts.tbl_post_pic AS i
          ON i.fld_post_fk = p.fld_post_pk
          INNER JOIN posts.tbl_post_tag AS tp
            ON tp.fld_post = p.fld_post_pk
            INNER JOIN tags.tbl_tags AS t
              ON t.fld_tags_pk = tp.fld_tag
      WHERE p.fld_is_public = true AND (p.fld_timestamp, p.fld_post_pk) >= ($1, $2) AND t.fld_tag_name = ANY($3) AND u.fld_user_pk <> $4
      ORDER BY p.fld_post_pk DESC, p.fld_timestamp DESC, i.fld_post_fk DESC
      LIMIT ($5 + 1);
      `

      returnFeed = await pool.query(query, [req.query.before, req.query.postID, "{" + craftFilter.join(",") + "}", curr_user, limit])
    }

    //if returned feed less than limit, no more posts
    if (returnFeed < limit) {
      morePosts = false
    }

    //fetch profile picture from S3 if it exists
    let avatarUrl = null;
    for (let i = 0; i < returnFeed.rowCount; i++) {
      const row = returnFeed.rows[i];
      if (row.fld_profile_pic) {
        const key = row.fld_profile_pic.includes("/")
          ? row.fld_profile_pic
          : `avatars/${row.fld_profile_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        avatarUrl = await getSignedFile(folder, fileName); // fresh 12h URL, every rerender refreshes timer
        row.fld_profile_pic = avatarUrl;
      }
    }

    //fetch post image (first one) from S3
    let postUrl = null;
    for (let i = 0; i < returnFeed.rowCount; i++) {
      const row = returnFeed.rows[i];
      if (row.fld_post_pic) {
        const key = row.fld_post_pic.includes("/")
          ? row.fld_post_pic
          : `posts/${row.fld_post_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        avatarUrl = await getSignedFile(folder, fileName); // fresh 12h URL, every rerender refreshes timer
        row.fld_post_pic = postUrl;
      }
    }

    //return data
    res.status(200).json({hasMore: morePosts, newFeed: returnFeed.rows.slice(0, limit)})

  }
  catch(error) {
    console.log("Error fetching posts: ", error)
    res.status(500).json(error)
  }
})

module.exports = router;
