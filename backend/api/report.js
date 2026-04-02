//work for new feature goes here
//bare-bones template
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt-checker before revealing any sensitive info
const authenticateToken = require('../middleware/authenticate');

const { valid_reason } = require("../functions/valid_reason")

//------------------------ FORUM REPORT -------------------------------
router.post("/report/forums/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;  //forum post id
        const { reason } = req.body;
        const userID = req.userID.trim()

        //ensure valid forum post id
        let query = `
        SELECT fld_post_pk
        FROM forums.tbl_forum_post
        WHERE fld_post_pk = $1;`

        const check_id = await pool.query(query, [id])

        if (check_id.rowCount === 0) {
            console.log("[report-forum]: Invalid post id")
            res.status(400).json({message: "Could not send report"})
            return
        }

        //check if user already made report for this post
        query = `
        SELECT fld_report_pk
        FROM report.tbl_forum_report
        WHERE fld_user_fk = $1 AND fld_forum_fk = $2;`

        const check_reported = await pool.query(query, [userID, id])

        if (check_reported.rowCount > 0) {
            console.log("[report-forum]: user already reproted this")
            res.status(403).json({message: "You already sent a report for this forum post!"})
            return
        }

        //check if post has already been deleted
        //if deleted, no report can be done as it's already resolved
        query = `
        SELECT fld_deleted
        FROM forums.tbl_forum_post
        WHERE fld_post_pk = $1;`

        const deleted = await pool.query(query, [id])

        if (deleted.rows[0].fld_deleted) {
            console.log("[report-forum]: Cannot report deleted forum post.")
            res.status(401).json({message: "Cannot report deleted forum post."})
            return
        }

        //check if reason is valid (within our list of reasons - doing this instead of checking
        //if within x number of characters)
        if (!valid_reason(reason)) {
            console.log("[report-forum]: Invalid report reason")
            res.status(401).json({message: "Could not send report."})
            return
        }

        //if user hasn't already created report - create one!
        const now = new Date()
        const date = now.toISOString()

        query = `
        INSERT INTO report.tbl_forum_report(fld_forum_fk, fld_user_fk, fld_report_reason, fld_date_reported)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `

       const report = await pool.query(query, [id, userID, reason, date])

       if (report.rowCount === 0) {
        console.log("[report-forum]: failed to insert report")
        res.status(400).json({message: "Failed to submit report. Please try again later."})
        return
       }

       //successfully submission
       res.status(201).json({message: "Report successfully submitted!"})

    }
    catch(error) {
        console.log("[report-forum]: Error occurred:", error)
        res.status(500).json(error)
        return
    }
})



//------------------------ POST REPORT -------------------------------
router.post("/report/posts/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params //explore post id
        const { reason } = req.body
        const userID = req.userID.trim()

        //ensure valid post id
        let query = `
        SELECT fld_post_pk
        FROM posts.tbl_post
        WHERE fld_post_pk = $1;`

        const check_id = await pool.query(query, [id])

        if (check_id.rowCount === 0) {
            console.log("[report-post]: Invalid post id")
            res.status(400).json({message: "Could not send report"})
            return
        }

        //verify user hasn't made report for post already
        query = `
        SELECT fld_report_pk
        FROM report.tbl_post_report
        WHERE fld_user_fk = $1 AND fld_post_fk = $2;`

        const check_reported = await pool.query(query, [userID, id])

        if (check_reported.rowCount > 0) {
            console.log("[report-post]: user already reproted this")
            res.status(403).json({message: "You already sent a report for this post!"})
            return
        }

        //check if reason is valid (within our list of reasons - doing this instead of checking
        //if within x number of characters)
        if (!valid_reason(reason)) {
            console.log("[report-post]: Invalid report reason")
            res.status(401).json({message: "Could not send report"})
            return
        }

        //if not, create a report for this post!!!
        const now = new Date()
        const date = now.toISOString()

        query = `
        INSERT INTO report.tbl_post_report(fld_post_fk, fld_user_fk, fld_report_reason, fld_date_reported)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `

       const report = await pool.query(query, [id, userID, reason, date])

       if (report.rowCount === 0) {
        console.log("[report-post]: failed to insert report")
        res.status(400).json({message: "Failed to submit report. Please try again later."})
        return
       }

       //successfully submission
       res.status(201).json({message: "Report successfully submitted!"})

    }
    catch(error) {
        console.log("[report-post]: Error occured:", error)
        res.status(500).json(error)
        return
    }
})


module.exports = router;