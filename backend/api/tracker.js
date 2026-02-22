//work for new feature goes here
//bare-bones template
const express = require("express");
const router = express.Router();
const { pool } = require("../backend_connection");
const { getSignedFile } = require("../s3_connection");

//jwt-checker before revealing any sensitive info
const authenticateToken = require("../middleware/authenticate");

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
        p.fld_cover_image,
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
        p.fld_cover_image,
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

    // cover image (expects full "folder/file" in DB, but supports legacy no-slash keys)
    if (projectInfo.fld_cover_image) {
      const coverParts = splitS3Key(projectInfo.fld_cover_image, "tracker");
      if (coverParts) {
        try {
          projectInfo.fld_cover_image = await getSignedFile(
            coverParts.folder,
            coverParts.fileName
          );
        } catch (e) {
          projectInfo.fld_cover_image = null;
        }
      } else {
        projectInfo.fld_cover_image = null;
      }
    }

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

module.exports = router;