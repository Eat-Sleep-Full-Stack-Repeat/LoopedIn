//work for new feature goes here
//bare-bones template
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt-checker before revealing any sensitive info
const authenticateToken = require('../middleware/authenticate');

//------------------------ FEATURE -------------------------------

//------------------------ WISHLIST FOLDER WORK -------------------------------

//fetching folders for project tracker page
router.get("/get-w-folders", authenticateToken, async (req, res) => {
  try {
    const curr_user = req.userID.trim();
    let isEmpty = false;    //assume that there is at least 1 folder that isn't "All"

    const query = `
      SELECT fld_folder_pk, fld_f_name
      FROM folders.tbl_folder
      WHERE fld_creator = $1 AND fld_type = 'W'
      ORDER BY fld_folder_pk;`;

    const returnFeed = await pool.query(query, [curr_user]);

    //if no folders, send a heads-up!
    //this prevents ragequitting
    if (returnFeed.rowCount === 0) {
      isEmpty = true;
    }

    res.status(200).json({feed: returnFeed.rows, empty: isEmpty});
    return;

  } catch (error) {
    console.log("[Wishlist]: Server error:", error);
    res.status(500).json(error);
  }
});


//------------------------ INVENTORY ITEM WORK -------------------------------

//fetching all items 
router.get("/get-w-items", authenticateToken, async (req, res) => {
  try {
    const curr_user = req.userID.trim();
    let isEmpty = false;    //assume that there is at least 1 item... but this may not be true

    const query = `
        SELECT w.fld_item_pk, w.fld_item_name, w.fld_num_items, f.fld_f_name
        FROM wishlist.tbl_wishlist_item as w
            LEFT OUTER JOIN folders.tbl_folder as f
            ON w.fld_w_folder_fk = f.fld_folder_pk
        WHERE fld_type = 'W' AND f.fld_creator = $1
        ORDER BY w.fld_item_pk;
        `;

    const returnFeed = await pool.query(query, [curr_user]);

    //if no folders, send a heads-up!
    //this prevents ragequitting
    if (returnFeed.rowCount === 0) {
      isEmpty = true;
    }

    res.status(200).json({feed: returnFeed.rows, empty: isEmpty});
    return;

  } catch (error) {
    console.log("[Wishlist]: Server error:", error);
    res.status(500).json(error);
  }
});



module.exports = router;