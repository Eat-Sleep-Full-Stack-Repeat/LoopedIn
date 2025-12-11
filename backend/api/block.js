//work for new feature goes here
//bare-bones template
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt-checker before revealing any sensitive info
const authenticateToken = require('../middleware/authenticate');

//------------------------ BLOCK WORK -------------------------------
//fetch block status for both current user and other user
router.get('/check-if-block/:otherUserID', authenticateToken, async (req, res) => {
    try {

        console.log("[block]: fetching block status")

        const { otherUserID } = req.params

        //if blocked by other user
        let ifBlocked = false

        //if current user blocked other user
        let ifUserBlocked = false

        //check if you blocked other user
        query = `
        SELECT fld_block_pk
	    FROM following_blocked.tbl_block
	    WHERE fld_user_id = $1 AND fld_blocked_user_id = $2;
        `

        let block_id = await pool.query(query, [req.userID.trim(), otherUserID])

        //in block table, so set ifuserblocked variable
        if (block_id.rowCount === 1) {
            ifUserBlocked = true
        }
        else if (block_id.rowCount > 1) {
            console.log(`[block]: current user ${req.userID.trim()} double blocked other user ${otherUserID}`)
            res.status(500)
            return
        }

        //check if you blocked other user
        query = `
        SELECT fld_block_pk
	    FROM following_blocked.tbl_block
	    WHERE fld_user_id = $1 AND fld_blocked_user_id = $2;
        `


        //other way around: check if other user blocked you
        block_id = await pool.query(query, [otherUserID, req.userID.trim()])

        if (block_id.rowCount === 1) {
            ifBlocked = true
        }
        else if (block_id.rowCount > 1) {
            console.log(`[block]: other user ${otherUserID} doubled blocked user ${req.userID.trim()}`)
            res.status(500)
            return
        }

        res.status(200).json({
            ifBlocked: ifBlocked,
            ifUserBlocked: ifUserBlocked
        })

    }
    catch(error) {
        console.log("Error fetching block status:", error)
        res.status(500).json(error)
    }
})



//block person
router.post('/block-user/:userID', authenticateToken, async (req, res) => {
    try {
        //url params -> person we want to block
        const { userID } = req.params

        //check if you blocked them already
        query = `
        SELECT fld_block_pk
	    FROM following_blocked.tbl_block
	    WHERE fld_user_id = $1 AND fld_blocked_user_id = $2;
        `

        const block_id = await pool.query(query, [req.userID.trim(), userID])

        //if already blocked
        if (block_id.rowCount > 0) {
            console.log("Error: already blocked user.")
            res.status(409).json({ message: "Already blocked this user." })
            return;
        }

        //covers all use cases of user following/followed for desired block user
        //adds new blocked connection
        query = `
        DELETE FROM following_blocked.tbl_follow
        WHERE (fld_user_id = $1 AND fld_follower_id = $2) 
        OR (fld_user_id = $2 AND fld_follower_id = $1);
        `

        await pool.query(query, [req.userID.trim(), userID])

        query = ` 
        INSERT INTO following_blocked.tbl_block(fld_user_id, fld_blocked_user_id)
        VALUES ($1, $2);
        `

        await pool.query(query, [req.userID.trim(), userID])


        console.log("Successful block")
        res.status(200).json({ message: "successfully blocked user!" })

    }
    catch(error) {
        console.log("Error blocking user:", error)
        res.status(500).json(error)
    }
})


//unblock person
router.delete('/block-user/:userID', authenticateToken, async(req, res) => {
    try {
        const { userID } = req.params

        //check if blocked
        query = `
        SELECT fld_block_pk
	    FROM following_blocked.tbl_block
	    WHERE fld_user_id = $1 AND fld_blocked_user_id = $2;
        `

        const block_id = await pool.query(query, [req.userID.trim(), userID])

        //invalid block
        if (block_id.rowCount < 1) {
            console.log("Error: user was never blocked in the first place")
            res.status(404).json({ message: "Cannot unblock user: never blocked in the first place." })
            return;
        }

        //now unblock
        query = `
        DELETE FROM following_blocked.tbl_block
        WHERE fld_block_pk = $1;
        `
        await pool.query(query, [block_id.rows[0].fld_block_pk])

        console.log("Successful unblock.")
        res.status(200).json({ message: "successfully unblocked user!" })

    }
    catch (error) {
        console.log("Error unblocking user:", error)
        res.status(500).json(error)
    }
})


//FIXME: ADD ME WHEN otheruserProfile is setup
//fetching the person that YOU BLOCKED -> this could be helpful in frontend loading user profile
//so that you can't hit the block button again (a useState functionality)
router.get('/block-user/:userID', authenticateToken, async(req, res) => {
    try {
        const { userID } = req.params

        //check if blocked
        query = `
        SELECT fld_block_pk
	    FROM following_blocked.tbl_block
	    WHERE fld_user_id = $1 AND fld_blocked_user_id = $2;
        `
        const block_id = await pool.query(query, [req.userID.trim(), userID])

        //if blocked, we return that yes, they're blocked (true)
        if (block_id.rowCount > 0) {
            console.log("return GET: user is blocked")
            res.status(200).json({ if_blocked: true })
            return;
        }
        else {
            console.log("return GET: user is NOT blocked")
            res.status(200).json({ if_blocked: false })
            return;
        }

    }
    catch(error) {
        console.log("Error fetching blocked user:", error)
        res.status(500).json(error)
    }
})


//FIXME: ADD ME WHEN otheruserProfile is setup
//fetching whether YOU are blocked by SOMEONE ELSE
//get blocked person --> would be helpful when you're routing someone's page and they blocked you (womp womp)
router.get('/blocked-by-user/:userID', authenticateToken, async(req, res) => {
    try {
        const { userID } = req.params

        //check if blocked by someone else
        query = `
        SELECT fld_block_pk
	    FROM following_blocked.tbl_block
	    WHERE fld_user_id = $1 AND fld_blocked_user_id = $2;
        `
        const block_id = await pool.query(query, [userID, req.userID.trim()])

        //if blocked, we return that yes, we are blocked (true)
        if (block_id.rowCount > 0) {
            console.log("return GET: you are blocked")
            res.status(200).json({ if_blocked: true })
            return;
        }
        else {
            console.log("return GET: you are NOT blocked")
            res.status(200).json({ if_blocked: false })
            return;
        }
    }
    catch(error) {
        console.log("Error fetching your blocked status:", error)
        res.status(500).json(error)
    }
})


//FIXME: ADD ME WHEN blocked page for logged-in user is ready
//get all blocked people for logged-in user -> for blocked page (when it appears)
router.get('/blocked-users', authenticateToken, async(req, res) => {
    try {
        //get everyone you blocked
        query = `
        SELECT u.fld_profile_pic, u.fld_username, u.fld_user_pk
	    FROM following_blocked.tbl_block AS b INNER JOIN login.tbl_user AS u
		    ON b.fld_blocked_user_id = u.fld_user_pk
	    WHERE b.fld_user_id = $1;
        `

        const blocked_users = await pool.query(query, [req.userID.trim()])

        //return blocked peeps (none to many)
        res.status(200).json(blocked_users.rows)

    }
    catch(error) {
        console.log("Error fetching all of your blocked users:", error)
        res.status(500).json(error)
    }
})


module.exports = router;