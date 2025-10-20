const express = require("express");
const router = express.Router();
const { pool } = require("../backend_connection");
const authenticateToken = require("../middleware/authenticate");
const { getSignedFile } = require("../s3_connection");

// GET /api/profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userPk = req.userID?.trim?.() || req.userID;

    // store only the S3 key in DB
    const q = `
      SELECT 
        fld_username   AS "userName",
        fld_user_bio   AS "userBio",
        fld_profile_pic AS "avatarKey"  -- store key, not signed url
      FROM login.tbl_user
      WHERE fld_user_pk = $1
    `;
    const r = await pool.query(q, [userPk]);
    if (r.rowCount === 0) return res.status(404).json({ error: "User not found" });

    const row = r.rows[0];
    let avatarUrl = null;

    if (row.avatarKey) {
      // row.avatarKey is either full "avatars/<filename>" or just filename
      const key = row.avatarKey.includes("/") ? row.avatarKey : `avatars/${row.avatarKey}`;
      const folder = key.split("/")[0];
      const fileName = key.split("/").slice(1).join("/"); 
      avatarUrl = await getSignedFile(folder, fileName);  // fresh 12h URL, every rerender refreshes timer
    }

    return res.status(200).json({
      userName: row.userName,
      userBio: row.userBio,
      avatarUrl, 
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
      let avatarUrlFresh = null;
      if (row.avatarKey) {
        const key = row.avatarKey.includes("/") ? row.avatarKey : `avatars/${row.avatarKey}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        avatarUrlFresh = await getSignedFile(folder, fileName);
      }
      return res.status(200).json({ userName: row.userName, userBio: row.userBio, avatarUrl: avatarUrlFresh });
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

    let avatarUrlFresh = null;
    if (row.avatarKey) {
      const key = row.avatarKey.includes("/") ? row.avatarKey : `avatars/${row.avatarKey}`;
      const folder = key.split("/")[0];
      const fileName = key.split("/").slice(1).join("/");
      avatarUrlFresh = await getSignedFile(folder, fileName);
    }

    return res.status(200).json({
      userName: row.userName,
      userBio: row.userBio,
      avatarUrl: avatarUrlFresh, 
    });
  } catch (e) {
    console.error("PATCH /profile error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
