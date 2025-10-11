//setup
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt work
require("dotenv").config({ path: '../.env' }); //env is not in api folder lol
const jwt = require("jsonwebtoken");
const key = String(process.env.JWT_KEY);

//allow bcrypt hashing
const bcrypt = require("bcrypt");
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);

//------------------------ LOGIN & SIGN-UP -------------------------------

//sign IN --> checking U&P
router.post("/login", async (req, res) => {
  console.log("Login route hit!"); // Add this
  const { email, password } = req.body;
  console.log("Login attempt with:", email);

  try {
    //check if user email in db
    const checkEmailExists = `SELECT fld_user_email, fld_user_password 
        FROM login.tbl_user
        WHERE fld_user_email = $1;`;

    //actually do the query
    const result1 = await pool.query(checkEmailExists, [email]);

    if (result1.rowCount == 0) {
      return res.status(401).json({ message: "No accounts with this email saved in system." });
    }

    //hash user's entered pwd and compare
    const fromDB = result1.rows[0].fld_user_password;
    const samePwd = await bcrypt.compare(password, fromDB);

    if (samePwd) {
        //success! --> get user ID to navigate to get JWT
        const getID = `
        SELECT fld_user_pk
        FROM login.tbl_user
        WHERE fld_user_email = $1`

        const result2 = await pool.query(getID, [email]);
        const currentUserID = result2.rows[0].fld_user_pk;
      
        //success! --> generate jwt (ACCESS)
        console.log("Generating jwt...");
        const token = jwt.sign({userID: currentUserID}, key, {expiresIn: '24h'});
        console.log("jwt made");
        res.json({token}); 

        //below is previous success response --> now just use token
        //res.status(200).json({ message: "Login success!" });
    } else {
      res.status(401).json({ message: "Incorrect password." });
    }
  } catch (error) {
    //throw 500 error if any error occurred during or after querying
    console.error("Database error:", error);
    res.status(500).json(error);
  }
});

//sign UP --> check if email exists, check if username exists, then add all to db
router.post("/signup", async (req, res) => {
  console.log("Sign-up route hit!");
  const { username, email, password } = req.body;
  console.log("Sign-up attempt with:", email);

  try {
      //check if entered email already exists
      const isEmailAvailable = `
        SELECT fld_user_email 
        FROM login.tbl_user
        WHERE fld_user_email = $1;`;

      const result1 = await pool.query(isEmailAvailable, [email]);

      if (result1.rowCount > 0) {
        return res.status(400).json({ message: "Email already in use." });
      }

      //check if entered username already exists
      const isUsernameAvailable = `
        SELECT fld_username
        FROM login.tbl_user
        WHERE fld_username = $1;`;

      const result2 = await pool.query(isUsernameAvailable, [username]);

      if (result2.rowCount > 0) {
        return res.status(400).json({ message: "Username already in use. Please choose another username." });
      }

      //hash user's chosen password
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const hashedPwd = await bcrypt.hash(password, salt);

    //insert new user into the database
      const addUser = `
        INSERT INTO login.tbl_user (fld_username, fld_user_email, fld_user_password) 
        VALUES ($1, $2, $3);`;

      await pool.query(addUser, [username, email, hashedPwd]);

      console.log("New user created:", email, username);

      //should be inserted! now get user ID to generate JWT
      const getID = `
      SELECT fld_user_pk
      FROM login.tbl_user
      WHERE fld_user_email = $1`

      const result3 = await pool.query(getID, [email]);
      const currentUserID = result3.rows[0].fld_user_pk;

      //generate jwt
      console.log("Generating jwt...");
      const token = jwt.sign({userID: currentUserID}, key, {expiresIn: '24h'});
      console.log("jwt made");
      res.json({token}); 

     // res.status(201).json({ message: "Sign-up success" });

    } catch (error) {
        console.error("Error during sign-up:", error);
        res.status(500).json({ message: "Server error, please try again later" });
    }
});

module.exports = router;