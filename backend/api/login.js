//setup
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

require("dotenv").config({ path: '../.env' });
const jwt = require("jsonwebtoken");
const key = String(process.env.JWT_KEY);

const bcrypt = require("bcrypt");
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);

// ------------------------ JWT MIDDLEWARE ------------------------

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid authorization header." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, key);
    req.userID = decoded.userID;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// ------------------------ LOGIN & SIGN-UP -------------------------------

router.post("/login", async (req, res) => {
  console.log("Login route hit!");
  const { email, password } = req.body;
  console.log("Login attempt with:", email);

  try {
    const checkEmailExists = `SELECT fld_user_email, fld_user_password 
        FROM login.tbl_user
        WHERE fld_user_email = $1;`;

    const result1 = await pool.query(checkEmailExists, [email]);

    if (result1.rowCount == 0) {
      return res.status(401).json({ message: "No accounts with this email saved in system." });
    }

    const fromDB = result1.rows[0].fld_user_password;
    const samePwd = await bcrypt.compare(password, fromDB);

    if (samePwd) {
      const getID = `
        SELECT fld_user_pk
        FROM login.tbl_user
        WHERE fld_user_email = $1`;

      const result2 = await pool.query(getID, [email]);
      const currentUserID = result2.rows[0].fld_user_pk;

      console.log("Generating jwt...");
      const token = jwt.sign({ userID: currentUserID }, key, { expiresIn: '24h' });
      console.log("jwt made");

      return res.json({ token });
    } else {
      return res.status(401).json({ message: "Incorrect password." });
    }
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json(error);
  }
});

router.post("/signup", async (req, res) => {
  console.log("Sign-up route hit!");
  const { username, email, password } = req.body;
  console.log("Sign-up attempt with:", email);

  try {
    const isEmailAvailable = `
      SELECT fld_user_email 
      FROM login.tbl_user
      WHERE fld_user_email = $1;`;

    const result1 = await pool.query(isEmailAvailable, [email]);

    if (result1.rowCount > 0) {
      return res.status(400).json({ message: "Email already in use." });
    }

    const isUsernameAvailable = `
      SELECT fld_username
      FROM login.tbl_user
      WHERE fld_username = $1;`;

    const result2 = await pool.query(isUsernameAvailable, [username]);

    if (result2.rowCount > 0) {
      return res.status(400).json({ message: "Username already in use. Please choose another username." });
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPwd = await bcrypt.hash(password, salt);

    const addUser = `
      INSERT INTO login.tbl_user (fld_username, fld_user_email, fld_user_password) 
      VALUES ($1, $2, $3);`;

    await pool.query(addUser, [username, email, hashedPwd]);

    console.log("New user created:", email, username);

    const getID = `
      SELECT fld_user_pk
      FROM login.tbl_user
      WHERE fld_user_email = $1`;

    const result3 = await pool.query(getID, [email]);
    const currentUserID = result3.rows[0].fld_user_pk;

    console.log("Generating jwt...");
    const token = jwt.sign({ userID: currentUserID }, key, { expiresIn: '24h' });
    console.log("jwt made");

    return res.json({ token });
  } catch (error) {
    console.error("Error during sign-up:", error);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
});

// ------------------------ VERIFY TOKEN ------------------------

router.get("/verify", authenticateToken, async (req, res) => {
  return res.status(200).json({
    valid: true,
    userID: req.userID,
  });
});

module.exports = router;