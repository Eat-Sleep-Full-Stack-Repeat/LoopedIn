//work for new feature goes here
//bare-bones template
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt-checker before revealing any sensitive info
const authenticateToken = require('../middleware/authenticate');

//------------------------ FOLDER ENDPOINTS -------------------------------

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
            ORDER BY f.fld_folder_pk ASC
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
            WHERE f.fld_creator = $1 AND f.fld_type = 'T' AND f.fld_folder_pk > $2
            GROUP BY (f.fld_folder_pk, f.fld_f_name, f.fld_craft_type)
            ORDER BY f.fld_folder_pk ASC
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

//endpoint to load folder data (folder name as of right now) onto folder-specific page
//made this to avoid refetching folder data upon every filter render
//also gives us the opportunity to load more folder-related data upon mount if needed
router.get("/folder/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const curr_user = req.userID.trim()
        let query

        query = `
        SELECT fld_f_name
        FROM folders.tbl_folder
        WHERE fld_creator = $1 AND fld_folder_pk = $2;`

        const folderData = await pool.query(query, [curr_user, id])

        //either the folder isn't yours or doesn't exist
        //will not specify both cases
        if (folderData.rowCount === 0) {
            console.log("[tracker]: invalid folder.")
            res.status(404).json({message: "Folder does not exist."})
            return
        }

        console.log("[tracker]: successfully fetched folder-specific data")
        res.status(200).json({folderName: folderData.rows[0].fld_f_name})

    }
    catch (error) {
        console.log("[tracker]: Server error fetching folder-specific data:", error)
        res.status(500).json(error)
    }
})


//------------------------ PROJECT ENDPOINTS -------------------------------
//folder-specific project loadup
router.get("/folder/:id/project", authenticateToken, async (req, res)=> {
    try {
        const { id } = req.params
        const curr_user = req.userID.trim()
        const statusFilter = req.query.status
        let query

        console.log("status: ", statusFilter)

        //limit status filter size before querying for input validation purposes
        if (statusFilter.length < 1 || statusFilter.length > 3) {
            console.log("[tracker]: Malformed status filter")
            res.status(400).json({message: "Bad Status Filter"})
            return;
        }

        //fetch our folder data (eager loading)
        //infinite scroll wouldn't be the best choice here as
        // 1. in general, the amount of projects is significantly small - probably should add a project limit
        // 2. it's a decent assumption that the user will typically access the first top projects first
        //    making infinite scroll unnecessary
        // 3. adding infinite scroll or any lazy scroll technique on a small data set
        //    can increase fetching latency over just directly fetching the requested data
        query = `
        SELECT p.fld_project_pk, p.fld_p_name, fld_status
        FROM tracker.tbl_project AS p INNER JOIN folders.tbl_folder AS f
            ON f.fld_folder_pk = p.fld_folder_fk
        WHERE p.fld_creator = $1 AND f.fld_folder_pk = $2 AND fld_status = ANY($3)
        ORDER BY p.fld_project_pk ASC;`

        const projects = await pool.query(query, [curr_user, id, '{' + statusFilter.join(',') + '}'])

        if (projects.rowCount === 0) {
            console.log("[tracker]: No projects per this category")
            res.status(404).json({message: "No projects"})
            return
        }

        console.log("[tracker]: fetched projects sucessfully")
        res.status(200).json({projects: projects.rows})

    }
    catch(error) {
        console.log("[tracker]: Server error fetching projects:", error)
        res.status(500).json(error)
    }
})


module.exports = router;
