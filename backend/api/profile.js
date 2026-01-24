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
        fld_user_pk     AS "userID",
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

    //get following
    query = `
    SELECT COUNT(*) AS following
    FROM following_blocked.tbl_follow
    WHERE fld_follower_id = $1;
    `
    const following = await pool.query(query, [userPk])

    //get followers
    query = `
    SELECT COUNT(*) AS followers
    FROM following_blocked.tbl_follow
    WHERE fld_user_id = $1;
    `
    const followers = await pool.query(query, [userPk])

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
    
    //now do the same but for saved
    let savedPosts = [];
    try {
      const postsSql2 = `
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
          INNER JOIN posts.tbl_post_saves AS s
            ON p.fld_post_pk = s.fld_post_fk
        WHERE s.fld_user_fk = $1
        ORDER BY p.fld_post_pk DESC
      `;

      const pr = await pool.query(postsSql2, [userPk]);

      savedPosts = await Promise.all(
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
      console.error("GET /profile: error loading saved posts:", err);
      savedPosts = [];
    }

    return res.status(200).json({
      userID: row.userID,
      userName: row.userName,
      userBio: row.userBio,
      following: following.rows[0].following,
      followers: followers.rows[0].followers,
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




//fetch other users
router.get("/profile/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    //get userdata
    query = `
      SELECT fld_username, fld_user_bio, fld_profile_pic, fld_user_pk
      FROM login.tbl_user
      WHERE fld_user_pk = $1
    `
    const basicUserData = await pool.query(query, [id])

    if (basicUserData.rowCount == 0) {
      console.log("[profile-other]: user does not exist")
      res.status(404).json({message: "User does not exist"})
      return
    }

    //obtain pfp
    const avatarUrl = await signKeyIfPresent(basicUserData.rows[0].fld_profile_pic)

    //get following
    query = `
    SELECT COUNT(*) AS following
    FROM following_blocked.tbl_follow
    WHERE fld_follower_id = $1;
    `
    const following = await pool.query(query, [id])

    //get followers
    query = `
    SELECT COUNT(*) AS followers
    FROM following_blocked.tbl_follow
    WHERE fld_user_id = $1;
    `
    const followers = await pool.query(query, [id])

    //get tags??


    //get posts
    let posts = [];
    try {
      query = `
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
        WHERE p.fld_creator = $1 AND p.fld_is_public='true'
        ORDER BY p.fld_post_pk DESC
      `;
      const user_posts = await pool.query(query, [id]);

      posts = await Promise.all(
        user_posts.rows.map(async (postRow) => {
          const previewUrl = await signPostKeyIfPresent(postRow.previewKey);
          return {
            postId: postRow.postId,
            caption: postRow.caption,
            previewUrl, // full signed URL or null
          };
        })
      );
    } 
    catch (error) {
      console.log("GET /profile: error loading posts:", error);
      posts = [];
    }

    //return everything
    res.status(200).json({
      userID: basicUserData.rows[0].fld_user_pk,
      userName: basicUserData.rows[0].fld_username,
      userBio: basicUserData.rows[0].fld_user_bio,
      avatarUrl: avatarUrl,
      following: following.rows[0].following,
      followers: followers.rows[0].followers,
      posts: posts,
      tags: [],
    })

  }
  catch(error) {
    console.error("[profile-other]: error fetching other profile:", error);
    res.status(500).json(error)
  }
})

module.exports = router;
