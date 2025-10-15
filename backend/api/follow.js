//work for new feature goes here
//bare-bones template
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt-checker before revealing any sensitive info
const authenticateToken = require('../middleware/authenticate');

//------------------------ FOLLOW/FOLLOWER API SETUP -------------------------------
//get followers for user
router.get("/get-followers", authenticateToken, async (req, res) => {
    try {
        //get all usernames and pfps of followers
        query =
        `SELECT u.fld_profile_pic, u.fld_username, u.fld_user_pk
         FROM following_blocked.tbl_follow AS f INNER JOIN login.tbl_user AS u
            ON u.fld_user_pk = f.fld_user_id
         WHERE f.fld_follower_id = $1;
        `
        const followers  = await pool.query(query, [req.userID.trim()])

        //return followers (none to many)
        res.status(200).json(followers.rows)
    }
    catch(error) {
        console.log("Error while fetching followers:", error)
        res.status(500).json(error)
    }
})


//get who they're following for user
router.get("/get-following", authenticateToken, async (req, res) => {
    try {
        //get all usernames and pfps of people user is following
        query = `
        SELECT u.fld_profile_pic, u.fld_username, u.fld_user_pk
	    FROM following_blocked.tbl_follow AS f INNER JOIN login.tbl_user AS u
		    ON u.fld_user_pk = f.fld_follower_id
	    WHERE f.fld_user_id = $1;
        `

        const following = await pool.query(query, [req.userID.trim()])

        //return who user is following (none to many)
        res.status(200).json(following.rows)
    }

    catch(error) {
        console.log("Error while fetching followers:", error)
        res.status(500).json(error)
    }
})


//unfollow user
router.delete("/unfollow-user", authenticateToken, async (req, res) => {
    try {

        const { followingID } = req.body

        //fetch the connection id -> just a safety thing
        query = `
        SELECT fld_connection_pk
	    FROM following_blocked.tbl_follow
	    WHERE fld_follower_id = $1 AND fld_user_id = $2;
        `
        const connectionID = await pool.query(query, [followingID, req.userID.trim()])

        //invalid connection
        if (connectionID.rowCount < 1) {
            console.log("Error: user was never followed in the first place")
            res.status(404).json({ message: "Cannot unfollow user: never followed in the first place." })
        }

        //now unfollow user
        query = `
        DELETE FROM following_blocked.tbl_follow
        WHERE fld_connection_pk = $1;
        `
        await pool.query(query, [connectionID.rows[0].fld_connection_pk])

        console.log("Successful unfollow.")

    }
    catch(error) {
        console.log("Error unfollowing user:", error)
        res.status(500).json(error)
    }
})


//follow user


//remove follower


module.exports = router;