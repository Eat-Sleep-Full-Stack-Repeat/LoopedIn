const express = require("express");
const router = express.Router();
const { pool } = require("../backend_connection");

// env, jwt, bcrypt
require("dotenv").config({ path: "../.env" });
const jwt = require("jsonwebtoken");
const key = String(process.env.JWT_KEY);
const bcrypt = require("bcrypt");
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 12);

// Checking Google idToken
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_WEB_CLIENT_ID = "483164962369-01iaiktisu321r3fac75a41k7hlcto5b.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_WEB_CLIENT_ID);

const DUMMY_PREFIX = "google:";
async function makeDummyHash(googleId) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(DUMMY_PREFIX + String(googleId), salt);
}

router.post("/google", async (req, res) => {

  const { idToken, email, googleId } = req.body || {};

  // Missing data check
  const missing = [];
  if (!idToken) missing.push("idToken");
  if (!email) missing.push("email");
  if (!googleId) missing.push("googleId");
  if (missing.length) {
    return res
      .status(400)
      .json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  try {
    // check idToken
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || payload.email !== email || payload.sub !== String(googleId)) {
      return res.status(401).json({ message: "Invalid Google token/payload" });
    }

    // Checking if the email existing
    const findUserSql = `
      SELECT fld_user_pk, fld_account_type
      FROM login.tbl_user
      WHERE fld_user_email = $1
      LIMIT 1;
    `;
    const existing = await pool.query(findUserSql, [email]);

    let userId;

    if (existing.rowCount > 0) {
      const user = existing.rows[0];

      if (String(user.fld_account_type).toUpperCase() === "GOOGLE") {
        // issue JWT for existing user
        userId = user.fld_user_pk;
      } else {
  
        return res.status(409).json({
          message: "This email register in our system, please use local login.",
        });
      }
    } else {
      // New google user 
      const baseUsername = (email.split("@")[0] || "user").trim();

      const dummyPwd = await makeDummyHash(googleId);

      const insertSql = `
        INSERT INTO login.tbl_user
          (fld_username, fld_user_email, fld_user_password, fld_account_type)
        VALUES ($1, $2, $3, 'GOOGLE')
        RETURNING fld_user_pk;
      `;
      const inserted = await pool.query(insertSql, [baseUsername, email, dummyPwd]);
      userId = inserted.rows[0].fld_user_pk;

    }

    const token = jwt.sign({ userID: userId }, key, { expiresIn: "24h" });

    return res.json({ token });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
});

module.exports = router;
