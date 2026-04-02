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


//create new wishlist folder
router.post("/new-w-folder", authenticateToken, async (req, res) => {
  try{
    const curr_user = req.userID.trim();
    const newName = req.body.name || "";

    console.log("newname is", newName);
    const query = `
        INSERT INTO folders.tbl_folder(fld_f_name, fld_creator, fld_type)
        VALUES ($1, $2, 'W');
    `;
    await pool.query(query, [newName, curr_user]);

    //check to confirm it was added
    const query2= `
        SELECT fld_folder_pk, fld_f_name
        FROM folders.tbl_folder
        WHERE fld_f_name = $1 AND fld_creator = $2 AND fld_type = 'W';
    `;
    const returnFeed = await pool.query(query2, [newName, curr_user]);

    if (returnFeed.rowCount === 0) {
      console.log("[wishlist]: error during folder creation.");
      res.status(404).json({ message: "Folder does not exist." });
      return;
    }
    else if (returnFeed.rowCount > 1){
      console.log("[wishlist]: error during folder creation.");
      res.status(404).json({ message: "Error during folder upload. Perhaps a duplicate name?" });
      return;
    }

    //else, the folder was successfully created
    //return the new id
    res.status(200).json({fID: returnFeed.rows[0].fld_folder_pk, fName: returnFeed.rows[0].fld_f_name});
    return;

  } catch (error){
    console.log("[Wishlist]: Server error when making folder:", error);
    res.status(500).json(error);
  }
});


//rename wishlist folder
router.put("/rename-w-folder", authenticateToken, async (req, res) => {
  try {
    const curr_user = req.userID.trim();
    const folderId = req.body.folderId;
    const newName = req.body.name || "";

    const duplicateQuery = `
      SELECT fld_folder_pk
      FROM folders.tbl_folder
      WHERE fld_creator = $1
        AND fld_type = 'W'
        AND LOWER(fld_f_name) = LOWER($2)
        AND fld_folder_pk != $3;
    `;
    const duplicateFeed = await pool.query(duplicateQuery, [curr_user, newName, folderId]);

    if (duplicateFeed.rowCount > 0) {
      res.status(409).json({ message: "Duplicate folder name." });
      return;
    }

    const query = `
      UPDATE folders.tbl_folder
      SET fld_f_name = $1
      WHERE fld_folder_pk = $2 AND fld_creator = $3 AND fld_type = 'W'
      RETURNING fld_folder_pk, fld_f_name;
    `;
    const returnFeed = await pool.query(query, [newName, folderId, curr_user]);

    if (returnFeed.rowCount === 0) {
      res.status(404).json({ message: "Folder does not exist." });
      return;
    }

    res.status(200).json({fID: returnFeed.rows[0].fld_folder_pk, fName: returnFeed.rows[0].fld_f_name});
    return;

  } catch (error) {
    console.log("[Wishlist]: Server error when renaming folder:", error);
    res.status(500).json(error);
  }
});


//delete wishlist folder
router.delete("/delete-w-folder/:folderId", authenticateToken, async (req, res) => {
  try {
    const curr_user = req.userID.trim();
    const folderId = req.params.folderId;

    const query = `
      DELETE FROM folders.tbl_folder
      WHERE fld_folder_pk = $1 AND fld_creator = $2 AND fld_type = 'W'
      RETURNING fld_folder_pk;
    `;
    const returnFeed = await pool.query(query, [folderId, curr_user]);

    if (returnFeed.rowCount === 0) {
      res.status(404).json({ message: "Folder does not exist." });
      return;
    }

    res.status(200).json({ message: "Folder deleted successfully." });
    return;

  } catch (error) {
    console.log("[Wishlist]: Server error when deleting folder:", error);
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