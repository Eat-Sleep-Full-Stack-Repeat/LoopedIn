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


// ----------------------------- COMMENTS -----------------------------

// get user info
router.get("/get-user-info", authenticateToken, async (req, res) => {
  console.log("Getting the user information");
  try {
    let query;

    query = `
    SELECT 	fld_username AS username, 
		        fld_profile_pic AS profilepic 
    FROM login.tbl_user
    WHERE fld_user_pk = $1;
    `

    const userInformation = await pool.query(query, [req.userID]);

    if (userInformation.rowCount !== 1 ){
      console.log("Could not find the current user");
      res.status(404).json({message: "Could not find the user for post comments"})
    }

    let avatarUrl = null;
    for (let i = 0; i < userInformation.rowCount; i++) {
      const row = userInformation.rows[i];
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

    console.log("returning this as the user ID: ", req.userID);
    console.log("Returning this as the user info: ", userInformation.rows);

    res.status(200).json({
      currentUserID: req.userID,
      currentUserInfo: userInformation.rows
    })

  } catch (e) {
    console.log("Error when getting the user information for post comments", e);
    res.status(500).json({message: "Error when getting user information for post comments"})
  }
})

//fetch comments

router.get("/get-post-comments", authenticateToken, async (req, res) => {
  console.log("In the backend - Going to fetch comments");
  const lastTimestamp = req.query.lastTimestamp; //need to fetch comments after this timestamp -> this is the last timestamp of comment on front-end
  const postID = req.query.postID; //post to fetch comments for
  const lastPostID = req.query.lastPostID; // ID for the last post returned to front-end
  let query;
  let newComments;
  try {
    // is this the first fetch? Need to check last timestamp -> no timestamp means front-end does not have any comments yet (fetch first 10)
    if ((!lastTimestamp) | (lastTimestamp === "null") | (lastTimestamp === "undefined")){
      query = `
      SELECT 	fld_comment_pk AS id, 
          fld_post_fk AS postID, 
          fld_commenter_fk AS commenterid, 
          fld_body AS body, 
          CAST (fld_timestamp AS TIMESTAMPTZ) AS dateposted,
          fld_username AS username, 
          fld_profile_pic AS profilePic 
      FROM posts.tbl_post_comment AS p
      INNER JOIN login.tbl_user AS l ON p.fld_commenter_fk = l.fld_user_pk
      WHERE p.fld_post_fk = $1
      ORDER BY p.fld_timestamp DESC
      LIMIT 11;
      `
      newComments = await pool.query(query, [postID]);
    } else {
      // not the first check so can use timestamp to order comments
      query = `
      SELECT 	fld_comment_pk AS id, 
          fld_post_fk AS postID, 
          fld_commenter_fk AS commenterid, 
          fld_body AS body, 
          CAST (fld_timestamp AS TIMESTAMPTZ) AS dateposted,
          fld_username AS username, 
          fld_profile_pic AS profilePic 
      FROM posts.tbl_post_comment AS p
      INNER JOIN login.tbl_user AS l ON p.fld_commenter_fk = l.fld_user_pk
      WHERE p.fld_post_fk = $1 AND (fld_timestamp, fld_comment_pk) < ($2, $3)
      ORDER BY p.fld_timestamp DESC
      LIMIT 11;
      `
      newComments = await pool.query(query, [postID, lastTimestamp, lastPostID]);
    }

    // check if there are more comments to fetch
    const hasMoreComments = newComments.rowCount > 10;

    let avatarUrl = null;
    for (let i = 0; i < newComments.rowCount; i++) {
      const row = newComments.rows[i];
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

    // return the chunk of comments and whether there are more to fetch
    res.status(200).json({
      newComments: newComments.rows.slice(0, 10),
      hasMoreComments
    })

  } catch (e) {
    console.log("Error when trying to fetch post comments", e);
  }
})

//add a comment
router.post("/add-post-comment", authenticateToken, async(req, res) => {
  console.log("Going to add the comment");
  const {postID, content} = req.body;
  const userID = req.userID;
  const timestamp = new Date();
  let query;

  console.log("The entered comment is: ", content);

  if (content === null){
    res.status(500);
  }

  try{
    //try to add the commemnt
    query = `
    INSERT INTO posts.tbl_post_comment (fld_post_fk, fld_commenter_fk, fld_body, fld_timestamp)
    VALUES ($1, $2, $3, $4)
    `
    await pool.query(query, [postID, userID, content, timestamp]);

    res.status(200).json({message: "Successfully added post comment"})
  } catch (e) {
    console.log("Error - could not add the post comment", e)
  }
})

//delete a comment
router.delete("/delete-post-comment", authenticateToken, async(req, res) => {
  console.log("Going to delete the comment");
  try {
    //check if the user has permission to delete that comment -> If not, then alert the user

    //check if the comment exists

    //try to delete the comment
  } catch (e) {
    console.log("Error - could not delete that comment ", e)
  }
})

module.exports = router;
