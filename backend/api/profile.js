const express = require("express");
const router = express.Router();
const { pool } = require("../backend_connection");
const authenticateToken = require("../middleware/authenticate");
const { getSignedFile } = require("../s3_connection");

// helper to turn an S3 key like "avatars/xxx.jpg" into a signed URL
async function signKeyIfPresent(key) {
  if (!key) return null;

  const safeKey = key.includes("/") ? key : `avatars/${key}`;
  const folder = safeKey.split("/")[0];
  const fileName = safeKey.split("/").slice(1).join("/");

  return getSignedFile(folder, fileName);
}

// helper for post preview keys ("posts/..."), same idea
async function signPostKeyIfPresent(key) {
  if (!key) return null;

  const safeKey = key.includes("/") ? key : `posts/${key}`;
  const folder = safeKey.split("/")[0];
  const fileName = safeKey.split("/").slice(1).join("/");

  return getSignedFile(folder, fileName);
}

// GET /api/profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userPk = req.userID?.trim?.() || req.userID;

    // ---- basic user info ----
    const q = `
      SELECT 
        fld_username    AS "userName",
        fld_user_bio    AS "userBio",
        fld_profile_pic AS "avatarKey"
      FROM login.tbl_user
      WHERE fld_user_pk = $1
    `;
    const r = await pool.query(q, [userPk]);
    if (r.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const row = r.rows[0];

    const avatarUrl = await signKeyIfPresent(row.avatarKey);

    // ---- user posts: first photo as preview ----
    let posts = [];
    try {
      const postsSql = `
        SELECT
          p.fld_post_pk AS "postId",
          p.fld_caption AS "caption",
          (
            SELECT pic.fld_post_pic
            FROM posts.tbl_post_pic pic
            WHERE pic.fld_post_fk = p.fld_post_pk
            ORDER BY pic.fld_pic_id ASC
            LIMIT 1
          ) AS "previewKey"
        FROM posts.tbl_post p
        WHERE p.fld_creator = $1
        ORDER BY p.fld_post_pk DESC
      `;
      const pr = await pool.query(postsSql, [userPk]);

      posts = await Promise.all(
        pr.rows.map(async (postRow) => {
          const previewUrl = await signPostKeyIfPresent(postRow.previewKey);
          return {
            postId: postRow.postId,
            caption: postRow.caption,
            previewUrl, // full signed URL or null
          };
        })
      );
    } catch (err) {
      console.error("GET /profile: error loading posts:", err);
      posts = [];
    }
    
    const savedPosts = [];

    return res.status(200).json({
      userName: row.userName,
      userBio: row.userBio,
      avatarUrl,
      posts,
      savedPosts,
    });
  } catch (e) {
    console.error("GET /profile error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/profile  (accept userBio and/or avatarUrl OR avatarKey)
router.patch("/profile", authenticateToken, express.json(), async (req, res) => {
  try {
    const userPk = req.userID?.trim?.() || req.userID;
    const { userBio, avatarUrl, avatarKey } = req.body || {};

    let keyToStore = avatarKey ?? null;
    if (!keyToStore && typeof avatarUrl === "string") {
      const match = avatarUrl.match(/\.amazonaws\.com\/([^?]+)/i);
      if (match) {
        keyToStore = match[1]; // "avatars/filename..."
      }
    }

    const setParts = [];
    const vals = [];
    let i = 1;

    if (typeof userBio === "string") {
      setParts.push(`fld_user_bio = $${i++}`);
      vals.push(userBio.trim());
    }
    if (keyToStore) {
      setParts.push(`fld_profile_pic = $${i++}`);
      vals.push(keyToStore);
    }

    if (setParts.length === 0) {
      const now = await pool.query(
        `SELECT fld_username AS "userName", fld_user_bio AS "userBio", fld_profile_pic AS "avatarKey"
         FROM login.tbl_user WHERE fld_user_pk = $1`,
        [userPk]
      );
      const row = now.rows[0] || {};
      const avatarUrlFresh = await signKeyIfPresent(row.avatarKey);

      return res
        .status(200)
        .json({ userName: row.userName, userBio: row.userBio, avatarUrl: avatarUrlFresh });
    }

    const sql = `
      UPDATE login.tbl_user
      SET ${setParts.join(", ")}
      WHERE fld_user_pk = $${i}
      RETURNING fld_username AS "userName", fld_user_bio AS "userBio", fld_profile_pic AS "avatarKey";
    `;
    vals.push(userPk);

    const r = await pool.query(sql, vals);
    const row = r.rows[0];

    const avatarUrlFresh = await signKeyIfPresent(row.avatarKey);

    return res.status(200).json({
      userName: row.userName,
      userBio: row.userBio,
      avatarUrl: avatarUrlFresh,
      // you can choose to add posts here too, but the frontend only needs them on GET
    });
  } catch (e) {
    console.error("PATCH /profile error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
