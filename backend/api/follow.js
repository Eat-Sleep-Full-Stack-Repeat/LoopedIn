//work for new feature goes here
//bare-bones template
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt-checker before revealing any sensitive info
const authenticateToken = require('../middleware/authenticate');

// ⬇️ NEW: import signer
const { getSignedFile } = require('../s3_connection');

//------------------------ FOLLOW/FOLLOWER API SETUP -------------------------------
//for currently logged-in user only

//check if follow other user
router.get("/check-if-follow/:otherUserID", authenticateToken, async (req, res) => {
    try {
        const { otherUserID } = req.params

        console.log("[follow]: fetching following status")

        //check if currently following
        query = `
        SELECT fld_connection_pk
	    FROM following_blocked.tbl_follow
	    WHERE fld_follower_id = $1 AND fld_user_id = $2;
        `
        const connectionID = await pool.query(query, [req.userID.trim(), otherUserID])

        if (connectionID.rowCount === 0) {
            console.log("follow status: false")
            res.status(200).json({followStatus: false})
            return
        }
        else if (connectionID.rowCount > 1) {
            console.log("You're following this user multiple times lol")
            res.status(500)
        }
        else {
            console.log("follow status: true")
            res.status(200).json({followStatus: true})
            return
        }

    }
    catch(error) {
        console.log("Error while fetching followers:", error)
        res.status(500).json(error)
    }
})



//get followers for user
router.get("/get-followers/:userID", authenticateToken, async (req, res) => {
    try {
        const { userID } = req.params
        console.log("get followers test")

        //get all usernames and pfps of followers
        let query =
        `
        SELECT u.fld_profile_pic, u.fld_username, u.fld_user_pk
	    FROM following_blocked.tbl_follow AS f INNER JOIN login.tbl_user AS u
		    ON u.fld_user_pk = f.fld_follower_id
	    WHERE f.fld_user_id = $1;
        `
        const followers  = await pool.query(query, [userID])

        // adds a signed URL (avatarUrl) for each row, if a key exists
        const rows = await Promise.all(
          followers.rows.map(async (row) => {
            let avatarUrl = null;
            if (row.fld_profile_pic) {
              const key = row.fld_profile_pic.includes('/')
                ? row.fld_profile_pic
                : `avatars/${row.fld_profile_pic}`;
              const folder = key.split('/')[0];
              const fileName = key.split('/').slice(1).join('/');
              avatarUrl = await getSignedFile(folder, fileName);
            }
            return { ...row, avatarUrl };
          })
        );

        //return followers (none to many)
        res.status(200).json(rows)
    }
    catch(error) {
        console.log("Error while fetching followers:", error)
        res.status(500).json(error)
    }
})


//get who they're following for user
router.get("/get-following/:userID", authenticateToken, async (req, res) => {
    try {
        const { userID } = req.params
        console.log("get following");
        //get all usernames and pfps of people user is following
        let query = `
        SELECT u.fld_profile_pic, u.fld_username, u.fld_user_pk
         FROM following_blocked.tbl_follow AS f INNER JOIN login.tbl_user AS u
            ON u.fld_user_pk = f.fld_user_id
         WHERE f.fld_follower_id = $1;
        `

        const following = await pool.query(query, [userID])

        // adds signed URL (avatarUrl) per row
        const rows = await Promise.all(
          following.rows.map(async (row) => {
            let avatarUrl = null;
            if (row.fld_profile_pic) {
              const key = row.fld_profile_pic.includes('/')
                ? row.fld_profile_pic
                : `avatars/${row.fld_profile_pic}`;
              const folder = key.split('/')[0];
              const fileName = key.split('/').slice(1).join('/');
              avatarUrl = await getSignedFile(folder, fileName);
            }
            return { ...row, avatarUrl };
          })
        );

        //return who user is following (none to many)
        res.status(200).json(rows)
    }

    catch(error) {
        console.log("Error while fetching followers:", error)
        res.status(500).json(error)
    }
})


//unfollow user
router.delete("/unfollow-user", authenticateToken, async (req, res) => {
    try {

        console.log("hit unfollow route")
        const { followingID } = req.body

        //fetch the connection id -> just a safety thing
        let query = `
        SELECT fld_connection_pk
	    FROM following_blocked.tbl_follow
	    WHERE fld_follower_id = $1 AND fld_user_id = $2;
        `
        const connectionID = await pool.query(query, [req.userID.trim(), followingID])

        //invalid connection
        if (connectionID.rowCount < 1) {
            console.log("Error: user was never followed in the first place")
            res.status(404).json({ message: "Cannot unfollow user: never followed in the first place." })
            return;
        }

        //now unfollow user
        query = `
        DELETE FROM following_blocked.tbl_follow
        WHERE fld_connection_pk = $1;
        `

        await pool.query(query, [connectionID.rows[0].fld_connection_pk])

        console.log("Successful unfollow.")
        res.status(200).json({ message: "successfully unfollowed user!" })

    }
    catch(error) {
        console.log("Error unfollowing user:", error)
        res.status(500).json(error)
    }
})


//FIXME: add connection of this to the frontend - change this endpoint as needed!
//follow user
router.post("/follow-user", authenticateToken, async (req, res) => {
    try {

        //other person's user ID 
        const { otherUserID } = req.body

        //check if you're blocked by user
        let query = `
        SELECT fld_block_pk
	    FROM following_blocked.tbl_block
	    WHERE fld_user_id = $1 AND fld_blocked_user_id = $2;
        `
        let block_id = await pool.query(query, [otherUserID, req.userID.trim()])

        //if blocked, can't follow
        if (block_id.rowCount > 0) {
            console.log("return POST follow: you are blocked")
            res.status(403).json({ message: "Cannot follow user: you are blocked" })
            return;
        }

        //check if you blocked user
        query = `
        SELECT fld_block_pk
	    FROM following_blocked.tbl_block
	    WHERE fld_user_id = $1 AND fld_blocked_user_id = $2;
        `
        block_id = await pool.query(query, [req.userID.trim(), otherUserID])

        //if blocked, can't follow
        if (block_id.rowCount > 0) {
            console.log("return POST follow: you blocked this user")
            res.status(403).json({ message: "Cannot follow user: you blocked them" })
            return;
        }

        //check if currently following
        query = `
        SELECT fld_connection_pk
	    FROM following_blocked.tbl_follow
	    WHERE fld_follower_id = $1 AND fld_user_id = $2;
        `
        const connectionID = await pool.query(query, [req.userID.trim(), otherUserID])

        //when person is already followed
        if (connectionID.rowCount > 0) {
            console.log("Error: already following user.")
            res.status(409).json({ message: "Already following this user." })
            return;
        }

        //insert connection
        query = `
        INSERT INTO following_blocked.tbl_follow(fld_user_id, fld_follower_id)
        VALUES ($1, $2);
        `
        await pool.query(query, [otherUserID, req.userID.trim()])

        console.log("Successful follow.")
        res.status(200).json({ message: "successfully followed user!" })

    }
    catch(error) {
        console.log("Error following user:", error)
        res.status(500).json(error)
    }
})

//remove follower
router.delete("/remove-follower", authenticateToken, async (req, res) => {
    try {

        const { followerID } = req.body

        //fetch the connection id -> just a safety thing
        let query = `
        SELECT fld_connection_pk
	    FROM following_blocked.tbl_follow
	    WHERE fld_follower_id = $1 AND fld_user_id = $2;
        `
        const connectionID = await pool.query(query, [followerID, req.userID.trim()])

        //invalid connection
        if (connectionID.rowCount < 1) {
            console.log("Error: user was never followed in the first place")
            res.status(404).json({ message: "Cannot unfollow user: never followed in the first place." })
            return;
        }

        //now remove follower
        query = `
        DELETE FROM following_blocked.tbl_follow
        WHERE fld_connection_pk = $1;
        `
        await pool.query(query, [connectionID.rows[0].fld_connection_pk])

        console.log("Successful removal of follower.")
        res.status(200).json({ message: "successfully removed follower!" })

    }
    catch(error) {
        console.log("Error removing follower:", error)
        res.status(500).json(error)
    }
})


module.exports = router;
