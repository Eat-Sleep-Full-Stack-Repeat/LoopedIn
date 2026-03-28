//work for new feature goes here
//bare-bones template
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const { pool } = require("../backend_connection");
const { uploadFile, getSignedFile } = require("../s3_connection");

//jwt-checker before revealing any sensitive info
const authenticateToken = require("../middleware/authenticate");

require("dotenv").config();

//helper for S3 cleanup
const deleteFile = async (fileName, folderName) => {
  try {
    const key = `${folderName}/${fileName}`;

    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    console.log(`[tracker]: Deleted from S3 -> ${key}`);
  } catch (err) {
    console.error("[tracker]: Error deleting file from S3:", err);
  }
};

//initialize S3
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3Client({
    region: process.env.BUCKET_REGION,
    credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.BUCKET_SECRET_KEY,
  },
});

/**
 * Multer setup: memory storage, 5MB max per file
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type. Use jpg, png, webp, or gif."));
    }
    cb(null, true);
  },
});

//------------------------ FOLDER ENDPOINTS -------------------------------

//fetching folders for project tracker page
router.get("/folder", authenticateToken, async (req, res) => {
  try {
    const curr_user = req.userID.trim();
    console.log("The current user is: ", curr_user);
    const limit = Number(req.query.limit) || 10;
    const postID = req.query.postID;
    const q = (req.query.q ?? "").toString().trim();
    let more_posts = true;
    let returnFeed;
    let query;

    if (q.length > 0) {
      query = `
            SELECT f.fld_folder_pk, f.fld_f_name, f.fld_craft_type, COUNT(p.fld_folder_fk) AS project_cnt
            FROM folders.tbl_folder AS f LEFT OUTER JOIN tracker.tbl_project AS p
                ON f.fld_folder_pk = p.fld_folder_fk
            WHERE f.fld_creator = $1 AND f.fld_type = 'T' AND f.fld_f_name ILIKE $2
            GROUP BY (f.fld_folder_pk, f.fld_f_name, f.fld_craft_type)
            ORDER BY f.fld_f_name ASC
            LIMIT $3;`;

      returnFeed = await pool.query(query, [curr_user, `%${q}%`, 50]);

      res.status(200).json({ hasMore: false, newFeed: returnFeed.rows });
      return;
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
            LIMIT($2 + 1);`;

      returnFeed = await pool.query(query, [curr_user, limit]);

      if (returnFeed.rowCount === 0) {
        console.log("[tracker]: No folders");
        res.status(404).json({ message: "No folders" });
        return;
      }
    } else {
      query = `
            SELECT f.fld_folder_pk, f.fld_f_name, f.fld_craft_type, COUNT(p.fld_folder_fk) AS project_cnt
            FROM folders.tbl_folder AS f LEFT OUTER JOIN tracker.tbl_project AS p
                ON f.fld_folder_pk = p.fld_folder_fk
            WHERE f.fld_creator = $1 AND f.fld_type = 'T' AND f.fld_folder_pk > $2
            GROUP BY (f.fld_folder_pk, f.fld_f_name, f.fld_craft_type)
            ORDER BY f.fld_folder_pk ASC
            LIMIT($3 + 1);`;

      returnFeed = await pool.query(query, [curr_user, postID, limit]);
    }

    //we need more posts?
    if (returnFeed.rowCount <= limit) {
      more_posts = false;
    }

    console.log("[tracker]: fetched project folders successfully");
    res
      .status(200)
      .json({ hasMore: more_posts, newFeed: returnFeed.rows.slice(0, limit) });
  } catch (error) {
    console.log("[tracker]: Server error:", error);
    res.status(500).json(error);
  }
});

//endpoint to load folder data (folder name as of right now) onto folder-specific page
//made this to avoid refetching folder data upon every filter render
//also gives us the opportunity to load more folder-related data upon mount if needed
router.get("/folder/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const curr_user = req.userID.trim();
    let query;

    query = `
        SELECT fld_f_name
        FROM folders.tbl_folder
        WHERE fld_creator = $1 AND fld_folder_pk = $2;`;

    const folderData = await pool.query(query, [curr_user, id]);

    //either the folder isn't yours or doesn't exist
    //will not specify both cases
    if (folderData.rowCount === 0) {
      console.log("[tracker]: invalid folder.");
      res.status(404).json({ message: "Folder does not exist." });
      return;
    }

    console.log("[tracker]: successfully fetched folder-specific data");
    res.status(200).json({ folderName: folderData.rows[0].fld_f_name });
  } catch (error) {
    console.log(
      "[tracker]: Server error fetching folder-specific data:",
      error
    );
    res.status(500).json(error);
  }
});


//create new tracker folder
router.post("/new-t-folder", authenticateToken, async (req, res) => {
  try{
    const curr_user = req.userID.trim();
    const newName = req.body.name;
    const craftType = req.body.type;

    const query = `
        INSERT INTO folders.tbl_folder(fld_f_name, fld_creator, fld_craft_type, fld_type)
        VALUES ($1, $2, $3, 'T');
    `;
    await pool.query(query, [newName, curr_user, craftType]);

    //check to confirm it was added
    const query2= `
        SELECT fld_folder_pk, fld_f_name, fld_craft_type
        FROM folders.tbl_folder
        WHERE fld_f_name = $1 AND fld_creator = $2 AND fld_craft_type = $3 AND fld_type = 'T';
    `;
    const returnFeed =  await pool.query(query2, [newName, curr_user, craftType]);

    //either the folder isn't yours or doesn't exist... or it is a duplicate??? (should already be protected but double-check)
    //will not specify both cases
    if (returnFeed.rowCount === 0) {
      console.log("[tracker]: error during folder creation.");
      res.status(404).json({ message: "Folder does not exist." });
      return;
    }
    else if (returnFeed.rowCount > 1){
      console.log("[tracker]: error during folder creation.");
      res.status(404).json({ message: "Error during folder upload. Perhaps a duplicate name?" });
      return;
    }

    //else, the folder was successfully created!
    //return the new id
    res.status(200).json({fID: returnFeed.rows[0].fld_folder_pk, fName: returnFeed.rows[0].fld_f_name, fType: returnFeed.rows[0].fld_craft_type});
    return;

  } catch (error){
    console.log("[Tracker]: Server error when making folder:", error);
    res.status(500).json(error);
  }
});


//folder conditional deletion
router.delete("/folder_delete", authenticateToken, async (req, res) => {
  try {
    //Get params from front-end (Folder ID, name)
    const currentUser = req.userID;
    /* 
        Front-end Body: 
            folderID,
            folderName,
    */
    const sentData = req.body;
    const { folderID, folderName } = sentData;
    let query;

    //first check if the folder exists:
    query = `SELECT * FROM folders.tbl_folder
    WHERE fld_folder_pk = $1 AND fld_creator = $2 AND fld_f_name = $3;`;

    const checkFolder = await pool.query(query, [
      folderID,
      currentUser,
      folderName,
    ]);
    if (checkFolder.rowCount === 0) {
      console.log("Could not find the folder to delete :(");
      res.status(404).json({ message: "Could not find folder" });
      return;
    }

    query = `SELECT * FROM tracker.tbl_project
    WHERE fld_folder_fk = $1 AND fld_creator = $2;`;

    const folderProjects = await pool.query(query, [folderID, currentUser]);
    if (folderProjects.rowCount > 0) {
      console.log("This folder still has projects!!");
      res.status(403).json({ message: "Folder has projects" });
      return;
    }

    //Query to delete folder
    query = `DELETE FROM folders.tbl_folder
    WHERE fld_folder_pk = $1 AND fld_creator = $2 AND fld_f_name = $3;`;

    await pool.query(query, [folderID, currentUser, folderName]);

    console.log("Successfully deleted folder!");
    return res.status(200).json({ message: "Folder was successfully deleted" });
  } catch (e) {
    console.log("Error when deleting the folder", e);
    res.status(500).json(e);
  }
});

//renaming the folder
router.patch("/folder_rename", authenticateToken, async (req, res) => {
  try {
    const currentUser = req.userID;
    /* 
          Front-end Body: 
              folderID,
              folderName,
              craftType
      */
    const sentData = req.body;
    const { folderID, folderName, craftType } = sentData;

    if (folderName.length > 20) {
      console.log("Folder name is too long");
      return res.status(403).json({ message: "Folder name too long" });
    }

    //fetch the folder to change
    let query;
    query = `SELECT * FROM folders.tbl_folder
      WHERE fld_creator = $1 AND fld_folder_pk = $2;`;

    const checkFolderExists = await pool.query(query, [currentUser, folderID]);

    if (checkFolderExists.rowCount === 0) {
      console.log("That folder does not exist");
      res.status(404).json({ message: "Folder not found" });
      return;
    }

    //update folder name
    query = `UPDATE folders.tbl_folder
     SET fld_f_name = $1, fld_craft_type = $4
     WHERE fld_creator = $2 AND fld_folder_pk = $3;`;

    await pool.query(query, [folderName, currentUser, folderID, craftType]);

    return res.status(200).json({ message: "Updated folder name" });
  } catch (e) {
    console.log("Error when updating folder name: ", e);
    return res.status(500).json(e);
  }
});

//------------------------ PROJECT ENDPOINTS -------------------------------
//folder-specific project loadup
router.get("/folder/:id/project", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const curr_user = req.userID.trim();
    const statusFilter = req.query.status;
    let query;

    console.log("status: ", statusFilter);

    //limit status filter size before querying for input validation purposes
    if (statusFilter.length < 1 || statusFilter.length > 3) {
      console.log("[tracker]: Malformed status filter");
      res.status(400).json({ message: "Bad Status Filter" });
      return;
    }

    query = `
        SELECT p.fld_project_pk, p.fld_p_name, fld_status
        FROM tracker.tbl_project AS p INNER JOIN folders.tbl_folder AS f
            ON f.fld_folder_pk = p.fld_folder_fk
        WHERE p.fld_creator = $1 AND f.fld_folder_pk = $2 AND fld_status = ANY($3)
        ORDER BY p.fld_project_pk ASC;`;

    const projects = await pool.query(query, [
      curr_user,
      id,
      "{" + statusFilter.join(",") + "}",
    ]);

    if (projects.rowCount === 0) {
      console.log("[tracker]: No projects per this category");
      res.status(404).json({ message: "No projects" });
      return;
    }

    console.log("[tracker]: fetched projects sucessfully");
    res.status(200).json({ projects: projects.rows });
  } catch (error) {
    console.log("[tracker]: Server error fetching projects:", error);
    res.status(500).json(error);
  }
});

//single project loadup
router.get("/project/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const curr_user = req.userID.trim();
    let query;

    query = `
      SELECT 
        p.fld_project_pk,
        p.fld_folder_fk,
        p.fld_creator,
        p.fld_p_name,
        p.fld_date_started,
        p.fld_date_completed,
        p.fld_notes,
        p.fld_status,
        f.fld_f_name
      FROM tracker.tbl_project AS p
      INNER JOIN folders.tbl_folder AS f
        ON f.fld_folder_pk = p.fld_folder_fk
      WHERE p.fld_creator = $1 AND p.fld_project_pk = $2;
    `;

    const project = await pool.query(query, [curr_user, id]);

    if (project.rowCount === 0) {
      console.log("[tracker]: project not found.");
      res.status(404).json({ message: "Project not found." });
      return;
    }

    console.log("[tracker]: fetched project successfully");
    res.status(200).json({ project: project.rows[0] });
  } catch (error) {
    console.log("[tracker]: Server error fetching project:", error);
    res.status(500).json(error);
  }
});

// edit project fields (title, note, start date only)
router.patch("/project/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const curr_user = req.userID.trim();
    const { title, note, dateStarted } = req.body;

    if (typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ message: "Invalid title" });
    }

    if (title.length > 40) {
      return res.status(400).json({ message: "Title too long" });
    }

    if (typeof note !== "string") {
      return res.status(400).json({ message: "Invalid note" });
    }

    if (note.length > 5000) {
      return res.status(400).json({ message: "Note too long" });
    }

    let parsedDate = null;
    if (dateStarted !== null && dateStarted !== undefined && dateStarted !== "") {
      const dateObj = new Date(dateStarted);
      if (Number.isNaN(dateObj.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      parsedDate = dateObj.toISOString();
    }

    const query = `
      UPDATE tracker.tbl_project
      SET
        fld_p_name = $1,
        fld_notes = $2,
        fld_date_started = $3
      WHERE fld_project_pk = $4
        AND fld_creator = $5
      RETURNING fld_project_pk;
    `;

    const result = await pool.query(query, [
      title.trim(),
      note,
      parsedDate,
      id,
      curr_user,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    return res.status(200).json({ message: "Project updated successfully." });
  } catch (error) {
    console.log("[tracker]: Server error updating project:", error);
    return res.status(500).json(error);
  }
});

function splitS3Key(rawKey, defaultFolder) {
  if (!rawKey) return null;

  const key = String(rawKey).trim();
  if (!key) return null;

  // if already like "tracker/abc.jpg" or "posts/abc.jpeg"
  if (key.includes("/")) {
    const parts = key.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const folder = parts[0];
    const fileName = parts.slice(1).join("/");

    if (!folder || !fileName) return null;
    return { folder, fileName };
  }

  // legacy fallback: "abc.jpg" -> `${defaultFolder}/abc.jpg`
  if (!defaultFolder) return null;
  return { folder: defaultFolder, fileName: key };
}

router.get("/single-project", authenticateToken, async (req, res) => {
  const projectID = req.query.id;
  const currentUser = req.userID?.trim?.() || req.userID;

  try {
    let query = `
      SELECT
        p.fld_project_pk,
        p.fld_folder_fk,
        p.fld_creator,
        p.fld_p_name,
        p.fld_date_started,
        p.fld_date_completed,
        p.fld_notes,
        p.fld_status,
        f.fld_f_name,
        i.fld_pic_id,
        i.fld_project_pic,
        i.fld_alt_text
      FROM tracker.tbl_project AS p
        INNER JOIN folders.tbl_folder AS f
          ON f.fld_folder_pk = p.fld_folder_fk
        LEFT JOIN tracker.tbl_project_pic AS i
          ON i.fld_project_fk = p.fld_project_pk
      WHERE p.fld_project_pk = $1
        AND p.fld_creator = $2
      ORDER BY i.fld_pic_id ASC;
    `;

    const returnFeed = await pool.query(query, [projectID, currentUser]);

    if (returnFeed.rowCount === 0) {
      console.log("[tracker]: project not found.");
      res.status(404).json({ message: "Project not found." });
      return;
    }

    const projectInfo = { ...returnFeed.rows[0] };
    projectInfo.fld_cover_image = null;

    // project pics
    let projectPics = [];
    for (let i = 0; i < returnFeed.rowCount; i++) {
      const row = returnFeed.rows[i];

      if (row.fld_project_pic) {
        const picParts = splitS3Key(row.fld_project_pic, "tracker");
        if (!picParts) continue;

        try {
          const pic = await getSignedFile(picParts.folder, picParts.fileName);
          projectPics.push([pic, row.fld_alt_text, row.fld_pic_id]);
        } catch (e) {
          // skip bad pics so you still get the rest
        }
      }
    }

    console.log("[tracker]: fetched single project successfully");
    res.status(200).json({ projectInfo, projectPics, currentUser });
  } catch (error) {
    console.log("[tracker]: Server error fetching single project:", error);
    res.status(500).json(error);
  }
});

//delete single project----------------------------
router.delete("/delete-project/:selectedProjId", authenticateToken, async (req, res) => {
  try {
    const { selectedProjId: id } = req.params;

    //check if person actually has permission to delete    
    query = `
    SELECT *
    FROM tracker.tbl_project
    WHERE fld_project_pk = $1 AND fld_creator = $2;
    `
    const post = await pool.query(query, [id, req.userID.trim()]);

    if (post.rowCount == 0) {
      console.log("No permissions to delete project")
      return res.status(403).json({message: "Does not have permission to delete project"})
    }
    else {

      //delete images (if exist) first from S3
      query = `
      SELECT fld_project_pic
      FROM tracker.tbl_project_pic
      WHERE fld_project_fk = $1 AND fld_project_pic IS NOT NULL;
      `

      let image_key = await pool.query(query, [id]);


      //finally, delete records from our RDS tables
      query = `
      DELETE FROM tracker.tbl_project
      WHERE fld_project_pk = $1;
      `

      await pool.query(query, [id])


      //now S3 image deletion time (non-cover first)
      if (image_key.rowCount != 0) {
        for(let i = 0; i < image_key.rowCount; i++){
          image_key = image_key.rows[i].fld_project_pic
          console.log("[tracker]: image we need to delete: ", image_key)

          //get variables
          const fullKey = image_key.includes("/") ? image_key : `project-tracker/${image_key}`;
          const folderName = fullKey.split("/")[0];
          const fileName = fullKey.split("/").slice(1).join("/");

          console.log("[tracker]: delete project images in process. foldername, filename ", folderName, fileName)

          //delete images (hopefully)
          await deleteFile(fileName, folderName);

          console.log("[tracker] successful deletion of project images")
        }
      }

      }

      res.status(200).json({message: "successful deletion of project!"})
    }
  catch(error) {
    console.log("Error deleting project: ", error)
    res.status(500).json(error)
  }
})

//-------------------------- CREATION ----------------------------
/**
 * POST /api/create-project
 *
 * multipart/form-data:
 *   title      : string
 *   startDate  : "true" | "false"
 *   notes      : string
 *   photos     : up to 5 image files (field name "photos")
 *   folder     : integer 
 *   altTexts  : JSON string array of alt texts (one per photo card)
 */
router.post("/create-project", authenticateToken, upload.array("photos", 5), async (req, res) => {
  const client = await pool.connect();
  try {
    const userPk = req.userID?.trim?.() || req.userID;
    const { title = "", startDate, notes = "", folderID, altTexts } = req.body || {};

    if (!userPk) {
      return res.status(401).json({ error: "Missing user id from auth token" });
    }

    if (!folderID) {
      return res.status(400).json({ error: "Missing folderID" });
    }

    // if (!req.files || req.files.length === 0) {
    //   return res.status(400).json({ error: "At least one photo is required" });
    // }

    const parsedDate = startDate ? new Date(startDate) : new Date();

   let altArray = [];

    try {
      if (altTexts) altArray = JSON.parse(altTexts);
    } catch (e) {
      console.error("Failed to parse altTexts JSON:", altTexts, e);
    }

    await client.query("BEGIN");

    // const now = new Date();
    // const date = now.toISOString();

    // 1) Insert Project
    const insertProjectSql = `
      INSERT INTO tracker.tbl_project
        (fld_folder_fk, fld_creator, fld_p_name, fld_date_started, fld_notes, fld_status)
      VALUES
        ($1, $2, $3, $4, $5, 'In Progress')
      RETURNING fld_project_pk AS "projectId"
    `;
    const projResult = await client.query(insertProjectSql, [
      folderID,
      userPk,
      title || "",
      startDate,
      notes || "",
    ]);
    const projId = projResult.rows[0].projectId;

    // 2) Upload images to S3 and insert into posts.tbl_post_pic
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const originalExt = path.extname(file.originalname) || ".jpg";
      const randomName = crypto.randomBytes(16).toString("hex");
      const fileName = `${projId}_${randomName}_${i}${originalExt}`;
      const folderName = "project-tracker";

      await uploadFile(file.buffer, fileName, folderName, file.mimetype);

      const s3Key = `${folderName}/${fileName}`;
      const altText = Array.isArray(altArray) && altArray[i] ? altArray[i] : "";

      const insertPicSql = `
        INSERT INTO tracker.tbl_project_pic
          (fld_project_fk, fld_project_pic, fld_alt_text)
        VALUES
          ($1, $2, $3)
      `;
      await client.query(insertPicSql, [projId, s3Key, altText]);
    }

    await client.query("COMMIT");

    return res.status(201).json({
      projectId: projId,
      message: "Project created successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /create-project error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});


module.exports = router;
