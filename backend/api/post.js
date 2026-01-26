// routes/post.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const { pool } = require("../backend_connection");
const authenticateToken = require("../middleware/authenticate");
const { uploadFile, getSignedFile } = require("../s3_connection");

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
      return cb(new Error("Unsupported file type. Use jpg, png, webp, or gif."));
    }
    cb(null, true);
  },
});


function normalizeCraftFilter(craft) {
  if (!craft) return ["Crochet", "Knit", "Misc"];
  if (Array.isArray(craft)) return craft.map(String);
  return [String(craft)];
}

function normalizeBeforeParam(beforeRaw) {
  if (beforeRaw == null) return null;

  let b = String(beforeRaw);

  b = b.replace(/ /g, "+");

  try {
    b = decodeURIComponent(b);
  } catch {

  }

  return b;
}

/**
 * POST /api/post
 *
 * multipart/form-data:
 *   caption   : string
 *   isPublic  : "true" | "false"
 *   tags      : JSON string array of tag strings (["beginner","crochet"])
 *   altTexts  : JSON string array of alt texts (one per photo card)
 *   craft     : "Crochet" | "Knit" | "Misc"
 *   photos    : up to 5 image files (field name "photos")
 */
router.post("/post", authenticateToken, upload.array("photos", 5), async (req, res) => {
  const client = await pool.connect();
  try {
    const userPk = req.userID?.trim?.() || req.userID;

    const { caption = "", isPublic = "true", tags, altTexts, craft } = req.body || {};

    if (!userPk) {
      return res.status(401).json({ error: "Missing user id from auth token" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one photo is required" });
    }

    let tagArray = [];
    let altArray = [];

    try {
      if (tags) tagArray = JSON.parse(tags);
    } catch (e) {
      console.error("Failed to parse tags JSON:", tags, e);
    }

    try {
      if (altTexts) altArray = JSON.parse(altTexts);
    } catch (e) {
      console.error("Failed to parse altTexts JSON:", altTexts, e);
    }

    await client.query("BEGIN");

    const now = new Date();
    const date = now.toISOString();

    // 1) Insert post
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

    // 2) Upload images to S3 and insert into posts.tbl_post_pic
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const originalExt = path.extname(file.originalname) || ".jpg";
      const randomName = crypto.randomBytes(16).toString("hex");
      const fileName = `${postId}_${randomName}_${i}${originalExt}`;
      const folderName = "posts";

      await uploadFile(file.buffer, fileName, folderName, file.mimetype);

      const s3Key = `${folderName}/${fileName}`;
      const altText = Array.isArray(altArray) && altArray[i] ? altArray[i] : "";

      const insertPicSql = `
        INSERT INTO posts.tbl_post_pic
          (fld_post_fk, fld_post_pic, fld_alt_text)
        VALUES
          ($1, $2, $3)
      `;
      await client.query(insertPicSql, [postId, s3Key, altText]);
    }

    // 2.5) craft filter tag (assumes craft exists in tags.tbl_tags)
    if (craft && String(craft).trim()) {
      let q = `
        SELECT fld_tags_pk
        FROM tags.tbl_tags
        WHERE fld_tag_name = $1;
      `;
      const filterResult = await client.query(q, [String(craft).trim()]);
      const filterID = filterResult.rows?.[0]?.fld_tags_pk;

      if (filterID) {
        q = `
          INSERT INTO posts.tbl_post_tag(fld_post, fld_tag)
          VALUES ($1, $2)
          ON CONFLICT (fld_post, fld_tag) DO NOTHING;
        `;
        await client.query(q, [postId, filterID]);
      }
    }

    // 3) Map tags -> IDs, insert missing tags, then link in posts.tbl_post_tag
    if (Array.isArray(tagArray) && tagArray.length > 0) {
      const cleanTags = tagArray
        .map((t) => (t || "").trim())
        .filter((t) => t.length > 0);

      if (cleanTags.length > 0) {
        const lowerNames = cleanTags.map((t) => t.toLowerCase());

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

        const insertPostTagSql = `
          INSERT INTO posts.tbl_post_tag
            (fld_post, fld_tag)
          VALUES
            ($1, $2)
          ON CONFLICT DO NOTHING
        `;

        for (const tagId of tagIds) {
          await client.query(insertPostTagSql, [postId, tagId]);
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
});

router.get("/post", authenticateToken, async (req, res) => {
  try {
    const curr_user = (req.userID || "").trim();
    const limit = Math.min(Number(req.query.limit || 10), 50);

    const craftFilter = normalizeCraftFilter(req.query.craft);

    let returnFeed;
    let query;
    let params;

    const before = normalizeBeforeParam(req.query.before);
    const postID = req.query.postID ? Number(req.query.postID) : null;

    const isFresh = !before || before === "undefined" || before === "null";

    if (isFresh) {
      query = `
        SELECT DISTINCT ON (p.fld_post_pk)
          u.fld_user_pk,
          p.fld_post_pk,
          u.fld_username,
          u.fld_profile_pic,
          p.fld_caption,
          CAST(p.fld_timestamp AS TIMESTAMPTZ) AS fld_timestamp,
          i.fld_pic_id,
          i.fld_post_pic,
          CASE WHEN pl.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_liked,
          CASE WHEN ps.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_saved
        FROM login.tbl_user AS u
          INNER JOIN posts.tbl_post AS p ON u.fld_user_pk = p.fld_creator
          INNER JOIN posts.tbl_post_pic AS i ON i.fld_post_fk = p.fld_post_pk
          INNER JOIN posts.tbl_post_tag AS tp ON tp.fld_post = p.fld_post_pk
          INNER JOIN tags.tbl_tags AS t ON t.fld_tags_pk = tp.fld_tag
          LEFT JOIN posts.tbl_post_likes AS pl
            ON pl.fld_post_fk = p.fld_post_pk
            AND pl.fld_user_fk = $2
          LEFT JOIN posts.tbl_post_saves AS ps
            ON ps.fld_post_fk = p.fld_post_pk
            AND ps.fld_user_fk = $2
        WHERE p.fld_is_public = true
          AND t.fld_tag_name = ANY($1)
          AND u.fld_user_pk <> $2
        ORDER BY p.fld_post_pk DESC, p.fld_timestamp DESC, i.fld_pic_id ASC
        LIMIT ($3 + 1);
      `;
      params = ["{" + craftFilter.join(",") + "}", curr_user, limit];
    } else {
      query = `
        SELECT DISTINCT ON (p.fld_post_pk)
          u.fld_user_pk,
          p.fld_post_pk,
          u.fld_username,
          u.fld_profile_pic,
          p.fld_caption,
          CAST(p.fld_timestamp AS TIMESTAMPTZ) AS fld_timestamp,
          i.fld_pic_id,
          i.fld_post_pic,
          CASE WHEN pl.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_liked,
          CASE WHEN ps.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_saved
        FROM login.tbl_user AS u
          INNER JOIN posts.tbl_post AS p ON u.fld_user_pk = p.fld_creator
          INNER JOIN posts.tbl_post_pic AS i ON i.fld_post_fk = p.fld_post_pk
          INNER JOIN posts.tbl_post_tag AS tp ON tp.fld_post = p.fld_post_pk
          INNER JOIN tags.tbl_tags AS t ON t.fld_tags_pk = tp.fld_tag
          LEFT JOIN posts.tbl_post_likes AS pl
            ON pl.fld_post_fk = p.fld_post_pk
            AND pl.fld_user_fk = $4
          LEFT JOIN posts.tbl_post_saves AS ps
            ON ps.fld_post_fk = p.fld_post_pk
            AND ps.fld_user_fk = $4
        WHERE p.fld_is_public = true
          AND (p.fld_timestamp, p.fld_post_pk) < ($1::timestamptz, $2)
          AND t.fld_tag_name = ANY($3)
          AND u.fld_user_pk <> $4
        ORDER BY p.fld_post_pk DESC, p.fld_timestamp DESC, i.fld_pic_id ASC
        LIMIT ($5 + 1);
      `;
      params = [before, postID, "{" + craftFilter.join(",") + "}", curr_user, limit];
    }

    returnFeed = await pool.query(query, params);

    if (returnFeed.rowCount === 0) {
      return res.status(404).json({ message: "No posts whatsoever" });
    }

    const hasMore = returnFeed.rowCount > limit;
    const sliced = returnFeed.rows.slice(0, limit);

    for (const row of sliced) {
      if (row.fld_profile_pic) {
        const key = row.fld_profile_pic.includes("/") ? row.fld_profile_pic : `avatars/${row.fld_profile_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        row.fld_profile_pic = await getSignedFile(folder, fileName);
      }
      if (row.fld_post_pic) {
        const key = row.fld_post_pic.includes("/") ? row.fld_post_pic : `posts/${row.fld_post_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        row.fld_post_pic = await getSignedFile(folder, fileName);
      }
    }

    return res.status(200).json({ hasMore, newFeed: sliced });
  } catch (error) {
    console.log("Error fetching posts: ", error);
    return res.status(500).json(error);
  }
});


router.post("/search", authenticateToken, async (req, res) => {
  try {
    const curr_user = (req.userID?.trim?.() || req.userID || "").trim();
    const limit = Math.min(Number(req.query.limit) || 10, 25);

    const { query, type } = req.body || {};
    const q = (query || "").toString().trim().toLowerCase();

    if (!q || !["user", "tag"].includes(type)) {
      return res.status(400).json({ message: "Invalid search request" });
    }

    // ---------------- USER SEARCH ----------------
    if (type === "user") {
      const uBeforeName = req.query.u_before_name ? String(req.query.u_before_name).toLowerCase() : null;
      const uBeforeId = req.query.u_before_id ? String(req.query.u_before_id) : null;

      let userQ = "";
      let userParams = [];

      if (!uBeforeName || !uBeforeId || uBeforeName === "null" || uBeforeId === "null") {
        userQ = `
          SELECT fld_user_pk, fld_username, fld_profile_pic
          FROM login.tbl_user
          WHERE LOWER(fld_username) LIKE $1
            AND fld_user_pk <> $2
          ORDER BY LOWER(fld_username) ASC, fld_user_pk ASC
          LIMIT ($3 + 1);
        `;
        userParams = [`%${q}%`, curr_user, limit];
      } else {
        userQ = `
          SELECT fld_user_pk, fld_username, fld_profile_pic
          FROM login.tbl_user
          WHERE LOWER(fld_username) LIKE $1
            AND fld_user_pk <> $2
            AND (LOWER(fld_username), fld_user_pk) > ($3, $4)
          ORDER BY LOWER(fld_username) ASC, fld_user_pk ASC
          LIMIT ($5 + 1);
        `;
        userParams = [`%${q}%`, curr_user, uBeforeName, uBeforeId, limit];
      }

      const userR = await pool.query(userQ, userParams);

      const hasMore = userR.rowCount > limit;
      const slicedUsers = userR.rows.slice(0, limit);

      for (const row of slicedUsers) {
        if (row.fld_profile_pic) {
          const key = row.fld_profile_pic.includes("/") ? row.fld_profile_pic : `avatars/${row.fld_profile_pic}`;
          const folder = key.split("/")[0];
          const fileName = key.split("/").slice(1).join("/");
          row.fld_profile_pic = await getSignedFile(folder, fileName);
        }
      }

      const users = slicedUsers.map((r) => ({
        userID: String(r.fld_user_pk),
        username: r.fld_username,
        profilePic: r.fld_profile_pic ?? null,
      }));

      return res.status(200).json({ hasMore, users });
    }

    // ---------------- TAG SEARCH ----------------
    const before = normalizeBeforeParam(req.query.before);
    const postID = req.query.postID ? Number(req.query.postID) : null;
    const isFresh = !before || before === "undefined" || before === "null";

    let postQuery = "";
    let postParams = [];

    if (isFresh) {
      postQuery = `
        SELECT DISTINCT ON (p.fld_post_pk)
          u.fld_user_pk,
          p.fld_post_pk,
          u.fld_username,
          u.fld_profile_pic,
          p.fld_caption,
          CAST(p.fld_timestamp AS TIMESTAMPTZ) AS fld_timestamp,
          i.fld_pic_id,
          i.fld_post_pic,
          CASE WHEN pl.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_liked,
          CASE WHEN ps.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_saved
        FROM login.tbl_user AS u
          INNER JOIN posts.tbl_post AS p ON u.fld_user_pk = p.fld_creator
          INNER JOIN posts.tbl_post_pic AS i ON i.fld_post_fk = p.fld_post_pk
          INNER JOIN posts.tbl_post_tag AS tp ON tp.fld_post = p.fld_post_pk
          INNER JOIN tags.tbl_tags AS t ON t.fld_tags_pk = tp.fld_tag
          LEFT JOIN posts.tbl_post_likes AS pl
            ON pl.fld_post_fk = p.fld_post_pk
            AND pl.fld_user_fk = $2
          LEFT JOIN posts.tbl_post_saves AS ps
            ON ps.fld_post_fk = p.fld_post_pk
            AND ps.fld_user_fk = $2
        WHERE p.fld_is_public = true
          AND LOWER(t.fld_tag_name) LIKE $1
          AND u.fld_user_pk <> $2
        ORDER BY p.fld_post_pk DESC, p.fld_timestamp DESC, i.fld_pic_id ASC
        LIMIT ($3 + 1);
      `;
      postParams = [`%${q}%`, curr_user, limit];
    } else {
      postQuery = `
        SELECT DISTINCT ON (p.fld_post_pk)
          u.fld_user_pk,
          p.fld_post_pk,
          u.fld_username,
          u.fld_profile_pic,
          p.fld_caption,
          CAST(p.fld_timestamp AS TIMESTAMPTZ) AS fld_timestamp,
          i.fld_pic_id,
          i.fld_post_pic,
          CASE WHEN pl.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_liked,
          CASE WHEN ps.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_saved
        FROM login.tbl_user AS u
          INNER JOIN posts.tbl_post AS p ON u.fld_user_pk = p.fld_creator
          INNER JOIN posts.tbl_post_pic AS i ON i.fld_post_fk = p.fld_post_pk
          INNER JOIN posts.tbl_post_tag AS tp ON tp.fld_post = p.fld_post_pk
          INNER JOIN tags.tbl_tags AS t ON t.fld_tags_pk = tp.fld_tag
          LEFT JOIN posts.tbl_post_likes AS pl
            ON pl.fld_post_fk = p.fld_post_pk
            AND pl.fld_user_fk = $4
          LEFT JOIN posts.tbl_post_saves AS ps
            ON ps.fld_post_fk = p.fld_post_pk
            AND ps.fld_user_fk = $4
        WHERE p.fld_is_public = true
          AND (p.fld_timestamp, p.fld_post_pk) < ($1::timestamptz, $2)
          AND LOWER(t.fld_tag_name) LIKE $3
          AND u.fld_user_pk <> $4
        ORDER BY p.fld_post_pk DESC, p.fld_timestamp DESC, i.fld_pic_id ASC
        LIMIT ($5 + 1);
      `;
      postParams = [before, postID, `%${q}%`, curr_user, limit];
    }

    const feedR = await pool.query(postQuery, postParams);

    const hasMore = feedR.rowCount > limit;
    const sliced = feedR.rows.slice(0, limit);

    for (const row of sliced) {
      if (row.fld_profile_pic) {
        const key = row.fld_profile_pic.includes("/") ? row.fld_profile_pic : `avatars/${row.fld_profile_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        row.fld_profile_pic = await getSignedFile(folder, fileName);
      }
      if (row.fld_post_pic) {
        const key = row.fld_post_pic.includes("/") ? row.fld_post_pic : `posts/${row.fld_post_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        row.fld_post_pic = await getSignedFile(folder, fileName);
      }
    }

    // tagsByPost
    const postIds = sliced.map((r) => Number(r.fld_post_pk)).filter(Boolean);
    let tagsByPost = {};

    if (postIds.length > 0) {
      const tagQ = `
        SELECT
          tp.fld_post AS post_id,
          t.fld_tag_name,
          t.fld_tag_color
        FROM posts.tbl_post_tag tp
        INNER JOIN tags.tbl_tags t
          ON t.fld_tags_pk = tp.fld_tag
        WHERE tp.fld_post = ANY($1::int[]);
      `;
      const tagR = await pool.query(tagQ, [postIds]);

      tagsByPost = tagR.rows.reduce((acc, row) => {
        const pid = String(row.post_id);
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push({ name: row.fld_tag_name, color: row.fld_tag_color });
        return acc;
      }, {});
    }

    return res.status(200).json({
      hasMore,
      newFeed: sliced,
      tagsByPost,
    });
  } catch (error) {
    console.log("Error searching: ", error);
    return res.status(500).json({ message: "Search failed" });
  }
});

router.get("/get-user-info", authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT fld_username AS username,
             fld_profile_pic AS profilepic
      FROM login.tbl_user
      WHERE fld_user_pk = $1;
    `;

    const userInformation = await pool.query(query, [req.userID]);

    if (userInformation.rowCount !== 1) {
      return res.status(404).json({ message: "Could not find the user for post comments" });
    }

    for (const row of userInformation.rows) {
      if (row.profilepic) {
        const key = row.profilepic.includes("/") ? row.profilepic : `avatars/${row.profilepic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        row.profilepic = await getSignedFile(folder, fileName);
      }
    }

    res.status(200).json({
      currentUserID: req.userID,
      currentUserInfo: userInformation.rows,
    });
  } catch (e) {
    console.log("Error when getting the user information for post comments", e);
    res.status(500).json({ message: "Error when getting user information for post comments" });
  }
});

router.get("/get-post-comments", authenticateToken, async (req, res) => {
  const lastTimestamp = req.query.lastTimestamp;
  const postID = req.query.postID;
  const lastPostID = req.query.lastPostID;

  let query;
  let newComments;

  try {
    if (!lastTimestamp || lastTimestamp === "null" || lastTimestamp === "undefined") {
      query = `
        SELECT fld_comment_pk AS id,
               fld_post_fk AS postID,
               fld_commenter_fk AS commenterid,
               fld_body AS body,
               CAST (fld_timestamp AS TIMESTAMPTZ) AS dateposted,
               fld_username AS username,
               fld_profile_pic AS profilepic
        FROM posts.tbl_post_comment AS p
        INNER JOIN login.tbl_user AS l ON p.fld_commenter_fk = l.fld_user_pk
        WHERE p.fld_post_fk = $1
        ORDER BY p.fld_timestamp DESC
        LIMIT 11;
      `;
      newComments = await pool.query(query, [postID]);
    } else {
      query = `
        SELECT fld_comment_pk AS id,
               fld_post_fk AS postID,
               fld_commenter_fk AS commenterid,
               fld_body AS body,
               CAST (fld_timestamp AS TIMESTAMPTZ) AS dateposted,
               fld_username AS username,
               fld_profile_pic AS profilepic
        FROM posts.tbl_post_comment AS p
        INNER JOIN login.tbl_user AS l ON p.fld_commenter_fk = l.fld_user_pk
        WHERE p.fld_post_fk = $1 AND (fld_timestamp, fld_comment_pk) < ($2, $3)
        ORDER BY p.fld_timestamp DESC
        LIMIT 11;
      `;
      newComments = await pool.query(query, [postID, lastTimestamp, lastPostID]);
    }

    const hasMoreComments = newComments.rowCount > 10;
    const sliced = newComments.rows.slice(0, 10);

    for (const row of sliced) {
      if (row.profilepic) {
        const key = row.profilepic.includes("/") ? row.profilepic : `avatars/${row.profilepic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        row.profilepic = await getSignedFile(folder, fileName);
      }
    }

    res.status(200).json({
      newComments: sliced,
      hasMoreComments,
      postID,
    });
  } catch (e) {
    console.log("Error when trying to fetch post comments", e);
    res.status(500).json({ message: "Error fetching comments" });
  }
});

router.post("/add-post-comment", authenticateToken, async (req, res) => {
  const { postID, content } = req.body;
  const userID = req.userID;
  const timestamp = new Date();

  if (content == null) {
    return res.status(400).json({ message: "Missing content" });
  }

  try {
    const query = `
      INSERT INTO posts.tbl_post_comment (fld_post_fk, fld_commenter_fk, fld_body, fld_timestamp)
      VALUES ($1, $2, $3, $4)
      RETURNING fld_comment_pk;
    `;
    const newID = await pool.query(query, [postID, userID, content, timestamp]);

    res.status(200).json({ message: newID.rows });
  } catch (e) {
    console.log("Error - could not add the post comment", e);
    res.status(500).json({ message: "Could not add comment" });
  }
});

router.delete("/delete-post-comment", authenticateToken, async (req, res) => {
  const user = req.userID;
  const commentToDelete = req.body.CommentID;

  try {
    const query = `
      DELETE FROM posts.tbl_post_comment
      WHERE fld_comment_pk = $1 AND fld_commenter_fk = $2;
    `;

    await pool.query(query, [commentToDelete, user]);

    res.status(200).json({ message: "Successfully deleted the post comment!" });
  } catch (e) {
    console.log("Error - could not delete that comment ", e);
    res.status(500).json({ message: "Could not delete the post comment" });
  }
});

// ----------------------------- SINGLE POST -----------------------------
router.get("/single-post", authenticateToken, async (req, res) => {
  const postID = req.query.id;
  const currentUser = req.userID;

  try {
    let query = `
    SELECT u.fld_user_pk, u.fld_username, u.fld_profile_pic, p.fld_caption, CAST(p.fld_timestamp AS TIMESTAMPTZ), i.fld_pic_id, i.fld_post_pic, i.fld_alt_text, p.fld_is_public, p.fld_post_pk, i.fld_pic_id,
      CASE WHEN pl.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_liked,
      CASE WHEN ps.fld_user_fk IS NULL THEN false ELSE true END AS fld_is_saved
      FROM login.tbl_user AS u INNER JOIN posts.tbl_post AS p
        ON u.fld_user_pk = p.fld_creator
        INNER JOIN posts.tbl_post_pic AS i
          ON i.fld_post_fk = p.fld_post_pk
        LEFT JOIN posts.tbl_post_likes AS pl
          ON pl.fld_post_fk = p.fld_post_pk
          AND pl.fld_user_fk = $2
        LEFT JOIN posts.tbl_post_saves AS ps
          ON ps.fld_post_fk = p.fld_post_pk
          AND ps.fld_user_fk = $2
      WHERE p.fld_post_pk = $1
      ORDER BY i.fld_pic_id`;

    const returnFeed = await pool.query(query, [postID, currentUser]);

    let query2 = `
      SELECT t.fld_tag_name
      FROM posts.tbl_post AS p
      INNER JOIN posts.tbl_post_tag AS tp ON tp.fld_post = p.fld_post_pk
      INNER JOIN tags.tbl_tags AS t ON t.fld_tags_pk = tp.fld_tag
      WHERE p.fld_post_pk = $1
    `;
    const returnFeed2 = await pool.query(query2, [postID]);

    let tags = [];
    for (let i = 0; i < returnFeed2.rowCount; i++) {
      tags.push(returnFeed2.rows[i].fld_tag_name);
    }

    if (returnFeed.rowCount > 0) {
      const row = returnFeed.rows[0];
      if (row.fld_profile_pic) {
        const key = row.fld_profile_pic.includes("/") ? row.fld_profile_pic : `avatars/${row.fld_profile_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        row.fld_profile_pic = await getSignedFile(folder, fileName);
      }
    }

    let postPics = [];
    for (let i = 0; i < returnFeed.rowCount; i++) {
      const row = returnFeed.rows[i];
      if (row.fld_post_pic) {
        const key = row.fld_post_pic.includes("/") ? row.fld_post_pic : `posts/${row.fld_post_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        pic = await getSignedFile(folder, fileName);
        postPics.push([pic, row.fld_alt_text, row.fld_pic_id]);
      }
    }

    res.status(200).json({ postInfo: returnFeed.rows[0], postPics, currentUser, tags });
  } catch (error) {
    console.log("Error fetching posts: ", error);
    res.status(500).json(error);
  }
});

// ----------------------------- POST LIKES -----------------------------
router.post("/toggle_like", authenticateToken, async (req, res) => {
  const postID = req.query.id;
  const currentUser = req.userID;

  if (!postID) {
    return res.status(400).json({ message: "Missing post id" });
  }

  try {
    const result = await pool.query(
      `
      WITH deleted AS (
        DELETE FROM posts.tbl_post_likes
        WHERE fld_post_fk = $1 AND fld_user_fk = $2
        RETURNING 1
      )
      INSERT INTO posts.tbl_post_likes (fld_post_fk, fld_user_fk, fld_time_saved)
      SELECT $1, $2, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM deleted)
      RETURNING fld_post_fk
      `,
      [postID, currentUser]
    );

    const liked = result.rowCount > 0;
    res.status(200).json({ liked });
  } catch (e) {
    console.log("Error toggling like: ", e);
    res.status(500).json({ message: "Could not toggle like" });
  }
});

router.post("/toggle_save", authenticateToken, async (req, res) => {
  const postID = req.query.id;
  const currentUser = req.userID;

  if (!postID) {
    return res.status(400).json({ message: "Missing post id" });
  }

  try {
    const result = await pool.query(
      `
      WITH deleted AS (
        DELETE FROM posts.tbl_post_saves
        WHERE fld_post_fk = $1 AND fld_user_fk = $2
        RETURNING 1
      )
      INSERT INTO posts.tbl_post_saves (fld_post_fk, fld_user_fk, fld_time_saved)
      SELECT $1, $2, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM deleted)
      RETURNING fld_post_fk
      `,
      [postID, currentUser]
    );

    const saved = result.rowCount > 0;
    res.status(200).json({ saved });
  } catch (e) {
    console.log("Error toggling save: ", e);
    res.status(500).json({ message: "Could not toggle save" });
  }
});

router.get("/check_if_liked", authenticateToken, async (req, res) => {
  const postID = req.query.id;
  const currentUser = req.userID;

  if (!postID) {
    return res.status(400).json({ message: "Missing post id" });
  }

  try {
    const result = await pool.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM posts.tbl_post_likes
        WHERE fld_post_fk = $1 AND fld_user_fk = $2
      ) AS liked
      `,
      [postID, currentUser]
    );
    res.status(200).json({ liked: result.rows[0].liked });
  } catch (e) {
    console.log("Error checking post like: ", e);
    res.status(500).json({ message: "Could not check like status" });
  }
});



// ----------------------------- EDIT/DELETE POST -----------------------------

router.delete("/delete-post", authenticateToken, async (req, res) => {
  const user = req.userID;
  const postToDelete = req.body.PostID;

  try {
    const query = `
      DELETE FROM posts.tbl_post
      WHERE fld_post_pk = $1 AND fld_creator = $2;
    `;

    await pool.query(query, [postToDelete, user]);

    res.status(200).json({ message: "Successfully deleted the post!" });
  } catch (e) {
    console.log("Error - could not delete that post", e);
    res.status(500).json({ message: "Could not delete the post" });
  }
});


router.patch("/update", authenticateToken, async (req, res) => {
  try{
    const user = req.userID;
    const postToUpdate = req.body.PostID;
    const caption = req.body.caption;
    const isPublic = req.body.isPublic;
    const pictures = req.body.pictures;

    //check creator status
    query = `
      SELECT *
      FROM posts.tbl_post
      WHERE fld_post_pk = $1 AND fld_creator = $2;
      `

      const post = await pool.query(query, [postToUpdate, user]);

      if (post.rowCount == 0) {
        //do not have permission to edit post
        console.log("[posts]: No permissions to edit post")
        res.status(403).json({message: "Forbidden: Do not have permission to edit post"})
      }
      else if (caption.length < 0 || caption.length > 1000) {
        //if caption too big or small (if we just skip the frontend altogether and just send API requests)
        console.log("[posts]: caption length is too big or small")
        res.status(403).json({message: "Forbidden: caption length does not fit size requirements"})
      }
      else {
        //else, edit contents of post
        query = `
        UPDATE posts.tbl_post
        SET fld_caption = $1, fld_is_public = $2, fld_edited = TRUE
        WHERE fld_post_pk = $3 AND fld_creator = $4
        RETURNING *;
        `

        //run query
        const updated_post = await pool.query(query, [caption, isPublic, postToUpdate, user])

        //check if it worked
        if (updated_post.rowCount == 0) {
          console.log("[posts]: Error editing post in query - base info")
          res.status(500).json({message: "Failed to edit post"})
        }

        //----------------------------

        for (const pic of pictures) {
          const query2 = `
            UPDATE posts.tbl_post_pic p
            SET fld_alt_text = $1
            FROM posts.tbl_post t
            WHERE p.fld_pic_id = $2
              AND p.fld_post_fk = t.fld_post_pk
              AND t.fld_creator = $3
            RETURNING p.*;
          `;

          const altTextUpdate = await pool.query(query2, [pic.altText, pic.id, user]);

            if (altTextUpdate.rowCount === 0) {
            console.log("[posts]: Failed to update alt text for pic", pic.id);
            return res.status(500).json({message: "Failed to update one or more image alt texts"});
          }
        }

        console.log("[posts]: Successfully updated post!")
        res.status(200).json(updated_post.rows[0])
      }
  }
  catch(error) {
    console.log("Error editing post: ", error)
    res.status(500).json(error)
  }
})


module.exports = router;
