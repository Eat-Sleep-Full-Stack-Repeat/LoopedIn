//work for new feature goes here
//bare-bones template
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt-checker before revealing any sensitive info
const authenticateToken = require('../middleware/authenticate');

//------------------------ FEATURE -------------------------------

//fetching folders for project tracker page
router.get('/folder', authenticateToken, async(req, res) => {
    try {
        const curr_user = req.userID.trim()
        const limit = Number(req.query.limit) || 10
        const postID = req.query.postID
        const q = (req.query.q ?? "").toString().trim()
        let more_posts = true
        let returnFeed
        let query

        if (q.length > 0) {
            query = `
            SELECT f.fld_folder_pk, f.fld_f_name, f.fld_craft_type, COUNT(p.fld_folder_fk) AS project_cnt
            FROM folders.tbl_folder AS f LEFT OUTER JOIN tracker.tbl_project AS p
                ON f.fld_folder_pk = p.fld_folder_fk
            WHERE f.fld_creator = $1 AND f.fld_type = 'T' AND f.fld_f_name ILIKE $2
            GROUP BY (f.fld_folder_pk, f.fld_f_name, f.fld_craft_type)
            ORDER BY f.fld_f_name ASC
            LIMIT $3;`

            returnFeed = await pool.query(query, [curr_user, `%${q}%`, 50])

            res.status(200).json({hasMore: false, newFeed: returnFeed.rows})
            return
        }

        //initial fetch
        //we get to use a join besides an inner join, yay
        if (postID == "undefined" || !postID) {
            query = `
            SELECT f.fld_folder_pk, f.fld_f_name, f.fld_craft_type, COUNT(p.fld_folder_fk) AS project_cnt
            FROM folders.tbl_folder AS f LEFT OUTER JOIN tracker.tbl_project AS p
                ON f.fld_folder_pk = p.fld_folder_fk
            WHERE f.fld_creator = $1 AND f.fld_type = 'T'
            GROUP BY (f.fld_folder_pk, f.fld_f_name, f.fld_craft_type)
            ORDER BY f.fld_folder_pk DESC
            LIMIT($2 + 1);`

            returnFeed = await pool.query(query, [curr_user, limit])

            if (returnFeed.rowCount === 0) {
                console.log("[tracker]: No folders")
                res.status(404).json({message: "No folders"})
                return
            }
        }
        else {
            query = `
            SELECT f.fld_folder_pk, f.fld_f_name, f.fld_craft_type, COUNT(p.fld_folder_fk) AS project_cnt
            FROM folders.tbl_folder AS f LEFT OUTER JOIN tracker.tbl_project AS p
                ON f.fld_folder_pk = p.fld_folder_fk
            WHERE f.fld_creator = $1 AND f.fld_type = 'T' AND f.fld_folder_pk < $2
            GROUP BY (f.fld_folder_pk, f.fld_f_name, f.fld_craft_type)
            ORDER BY f.fld_folder_pk DESC
            LIMIT($3 + 1);`

            returnFeed = await pool.query(query, [curr_user, postID, limit])
        }

        //we need more posts?
        if (returnFeed.rowCount <= limit) {
            more_posts = false
        }

        console.log("[tracker]: fetched project folders successfully")
        res.status(200).json({hasMore: more_posts, newFeed: returnFeed.rows.slice(0, limit)})

    }
    catch(error) {
        console.log("[tracker]: Server error:", error)
        res.status(500).json(error)
    }

})

module.exports = router
