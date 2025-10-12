//setup
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt-checker before revealing any sensitive info
const authenticateToken = require('../middleware/authenticate');


//------------------------ PROFILE -------------------------------

//get username from DB
router.get("/profile", authenticateToken, async (req, res) => {
  try {
      //query for getting username
        console.log("loading username for this user...");

        const query = 
        `SELECT fld_username
        FROM login.tbl_user
        WHERE fld_user_pk = $1;`

        //wait for query to finalize
        const result = await pool.query(query, [req.userID.trim()]);

        //console.log("result is", result);

        //send an 201 (OK) status as for success
        //return query in JSON format
        res.status(201).json(result.rows[0])
    }
    //throw 500 error if any error occurred during or after querying
    catch(error) {
      console.error("error detected:", error);
        res.status(500).json(error)
    }
})


module.exports = router;