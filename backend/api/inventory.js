//work for new feature goes here
//bare-bones template
const express = require('express');
const router = express.Router();
const { pool } = require('../backend_connection');

//jwt-checker before revealing any sensitive info
const authenticateToken = require('../middleware/authenticate');

//------------------------ INVENTORY FOLDER WORK -------------------------------

//fetching folders for project tracker page
router.get("/get-i-folders", authenticateToken, async (req, res) => {
  try {
    const curr_user = req.userID.trim();
    let isEmpty = false;    //assume that there is at least 1 folder that isn't "All"

    const query = `
      SELECT fld_folder_pk, fld_f_name
      FROM folders.tbl_folder
      WHERE fld_creator = $1 AND fld_type = 'I'
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
    console.log("[Inventory]: Server error:", error);
    res.status(500).json(error);
  }
});


//create new inventory folder
router.post("/new-i-folder", authenticateToken, async (req, res) => {
  try{
    const curr_user = req.userID.trim();
    const newName = req.body.name || "";

    console.log("newname is", newName);
    const query = `
        INSERT INTO folders.tbl_folder(fld_f_name, fld_creator, fld_type)
        VALUES ($1, $2, 'I');
    `;
    await pool.query(query, [newName, curr_user]);

    //check to confirm it was added
    const query2= `
        SELECT fld_folder_pk, fld_f_name
        FROM folders.tbl_folder
        WHERE fld_f_name = $1 AND fld_creator = $2 AND fld_type = 'I';
    `;
    const returnFeed = await pool.query(query2, [newName, curr_user]);

    //either the folder isn't yours or doesn't exist... or it is a duplicate??? (should already be protected but double-check)
    //will not specify both cases
    if (returnFeed.rowCount === 0) {
      console.log("[inventory]: error during folder creation.");
      res.status(404).json({ message: "Folder does not exist." });
      return;
    }
    else if (returnFeed.rowCount > 1){
      console.log("[inventory]: error during folder creation.");
      res.status(404).json({ message: "Error during folder upload. Perhaps a duplicate name?" });
      return;
    }

    //else, the folder was successfully created!
    //return the new id
    res.status(200).json({fID: returnFeed.rows[0].fld_folder_pk, fName: returnFeed.rows[0].fld_f_name});
    return;

  } catch (error){
    console.log("[Inventory]: Server error when making folder:", error);
    res.status(500).json(error);
  }
});


//rename inventory folder
router.put("/rename-i-folder", authenticateToken, async (req, res) => {
  try {
    const curr_user = req.userID.trim();
    const folderId = req.body.folderId;
    const newName = req.body.name || "";

    const duplicateQuery = `
      SELECT fld_folder_pk
      FROM folders.tbl_folder
      WHERE fld_creator = $1
        AND fld_type = 'I'
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
      WHERE fld_folder_pk = $2 AND fld_creator = $3 AND fld_type = 'I'
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
    console.log("[Inventory]: Server error when renaming folder:", error);
    res.status(500).json(error);
  }
});


//delete inventory folder
router.delete("/delete-i-folder/:folderId", authenticateToken, async (req, res) => {
  try {
    const curr_user = req.userID.trim();
    const folderId = req.params.folderId;

    const query = `
      DELETE FROM folders.tbl_folder
      WHERE fld_folder_pk = $1 AND fld_creator = $2 AND fld_type = 'I'
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
    console.log("[Inventory]: Server error when deleting folder:", error);
    res.status(500).json(error);
  }
});


//------------------------ INVENTORY ITEM WORK -------------------------------

//fetching all items 
router.get("/get-i-items", authenticateToken, async (req, res) => {
  try {
    const curr_user = req.userID.trim();
    let isEmpty = false;    //assume that there is at least 1 item... but this may not be true

    const query = `
        SELECT i.fld_item_pk, i.fld_item_name, i.fld_num_items, f.fld_f_name
        FROM inventory.tbl_inventory_item as i
            LEFT OUTER JOIN folders.tbl_folder as f
            ON i.fld_i_folder_fk = f.fld_folder_pk
        WHERE fld_type = 'I' AND f.fld_creator = $1
        ORDER BY i.fld_item_pk;
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
    console.log("[Inventory]: Server error:", error);
    res.status(500).json(error);
  }
});

//Add an item
router.post("/add-inventory-item", authenticateToken, async (req, res) => {
  console.log("Adding the item to the backend");
  try {
    const currentUser = req.userID;
    //Get the item name and category from front-end
    const { itemName, itemCategory } = req.body;

    let query = ``;

    //make sure the itemCategory exists and that the user has access
    query = `SELECT * FROM folders.tbl_folder
            WHERE fld_creator = $1 
              AND fld_type = 'I' 
              AND fld_f_name = $2;`;

    const checkCategory = await pool.query(query, [currentUser, itemCategory]);
    if (checkCategory.rowCount === 0) {
      console.log("That category does not exist");
      res.status(404).json({ message: "That category does not exist" });
      return;
    }

    //Get the itemCategory ID
    const folderID = checkCategory.rows[0].fld_folder_pk;

    query = `INSERT INTO inventory.tbl_inventory_item (fld_i_folder_fk, fld_creator, fld_item_name, fld_num_items)
    VALUES ($1, $2, $3, $4)
    RETURNING fld_item_pk;`;

    const newItemRow = await pool.query(query, [
      folderID,
      currentUser,
      itemName,
      0,
    ]);

    if (newItemRow.rowCount === 0) {
      res.status(500).json({ message: "Error when adding inventory item" });
      return;
    }

    res.status(200).json({
      message: "Successfully added inventory item",
      item: newItemRow.rows[0],
    });
    return;
  } catch (e) {
    console.log("Error when adding inventory item: ", e);
    res.status(500).json(e);
  }
});

//Update an item -> name and number of items
router.patch("/edit-inventory-item", authenticateToken, async (req, res) => {
  console.log("Editing inventory item!");
  try {
    const { itemID, newName, newCount } = req.body; //cleanup of this data is done on front-end
    let query;

    console.log(
      "The things passed from the front-end: ",
      itemID,
      newName,
      newCount
    );

    query = `UPDATE inventory.tbl_inventory_item
    SET fld_item_name = $1, fld_num_items = $2
    WHERE fld_item_pk = $3;`;

    await pool.query(query, [newName, newCount, itemID]);

    res.status(200).json({ message: "Successfully updated inventory item!" });
    return;
  } catch (e) {
    console.log("Error when updating inventory item name/count: ", e);
    res.status(500).json({ message: e });
  }
});

//Delete an item
router.delete("/delete-inventory-item", authenticateToken, async (req, res) => {
  console.log("Going to delete an inventory item!");
  try {
    //front-end will pass item id
    const { itemID } = req.body;

    //check if the user has access to delete that item:
    const curr_user = req.userID;

    let query;

    query = `SELECT * FROM inventory.tbl_inventory_item
    WHERE fld_creator = $1 AND fld_item_pk = $2;`;

    const doubleCheckUser = await pool.query(query, [curr_user, itemID]);
    if (doubleCheckUser.rowCount === 0) {
      res
        .status(401)
        .json({ message: "User does not have access to delete that item" });
      return;
    }

    //if user has access -> delete item
    query = `DELETE FROM inventory.tbl_inventory_item
    WHERE fld_creator = $1 AND fld_item_pk = $2;`;

    await pool.query(query, [curr_user, itemID]);

    res.status(200).json({ message: "Successfully deleted inventory item" });
    return;
  } catch (e) {
    res.status(500).json({ message: e });
  }
});


module.exports = router;