const express = require("express");
const router = express.Router();
const { pool } = require("../backend_connection");

//jwt-checker before revealing any sensitive info
const authenticateToken = require("../middleware/authenticate");
const { getSignedFile, uploadFile, deleteFile } = require("../s3_connection");

const { generateColor } = require("../functions/color_generator");

const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

//-------------------- MULTER SETUP ---------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max

  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error("Unsupported file type. Use jpg, png, webp, or gif.")
      );
    }
    cb(null, true);
  },
});

//------------------------ FORUMS -------------------------------

// ----------- RECENT FORUMS -------------
//get request -> return a list of forums
// everything in req.query is from the fetch URL query
router.get("/get-forums", authenticateToken, async (req, res) => {

  const currentUser = req.userID;

  try {
    const limit = parseInt(req.query.limit); // number of posts to return -> determined by front-end
    //const queryTime = new Date(res.query.before); // which posts to query (determined by date posted)
    let morePosts = true; // used to check if there are any more posts (false -> front-end should stop fetching data)
    let query;
    let returnedFeed;
    let craftFilter = req.query.craft;

    // need to check if there was a timestamp passed from the frontend (used to sort feed and keep consistent)
    if (
      (req.query.before === "undefined") |
      (req.query.before === "null") |
      !req.query.before
    ) {
      // loads the initial batch of data (no timestamp to check, just the most recent posts)
      query = `
      SELECT u.fld_username, u.fld_profile_pic, ff.fld_header, ff.fld_body, ff.fld_pic, CAST(ff.fld_timestamp AS TIMESTAMPTZ) , ff.fld_post_pk
      FROM login.tbl_user AS u 
      INNER JOIN forums.tbl_forum_post AS ff 
          ON u.fld_user_pk = ff.fld_creator
          INNER JOIN forums.tbl_forum_tag AS tr
            ON ff.fld_post_pk = tr.fld_post
            INNER JOIN tags.tbl_tags AS tt
              ON tr.fld_tag = tt.fld_tags_pk
      WHERE tt.fld_tag_name = ANY($2) AND u.fld_user_pk <> $3
      ORDER BY ff.fld_timestamp DESC, ff.fld_post_pk DESC
      LIMIT ($1 + 1);
        `;

      returnedFeed = await pool.query(query, [
        limit,
        "{" + craftFilter.join(",") + "}",
        currentUser,
      ]);
    } else {
      // loads more data after the initial batch (uses timestamp of last returned post to get more -> ensures working with same set of data)
      query = `
      SELECT u.fld_username, u.fld_profile_pic, ff.fld_header, ff.fld_body, ff.fld_pic, CAST(ff.fld_timestamp AS TIMESTAMPTZ) , ff.fld_post_pk
      FROM login.tbl_user AS u 
      INNER JOIN forums.tbl_forum_post AS ff 
          ON u.fld_user_pk = ff.fld_creator
          INNER JOIN forums.tbl_forum_tag AS tr
            ON ff.fld_post_pk = tr.fld_post
            INNER JOIN tags.tbl_tags AS tt
              ON tr.fld_tag = tt.fld_tags_pk
      WHERE (ff.fld_timestamp, ff.fld_post_pk) < ($1, $2) AND tt.fld_tag_name = ANY($4) AND u.fld_user_pk <> $5
      ORDER BY ff.fld_timestamp DESC, ff.fld_post_pk DESC
      LIMIT ($3 + 1);
        `;
      returnedFeed = await pool.query(query, [
        req.query.before,
        req.query.postID,
        limit,
        "{" + craftFilter.join(",") + "}",
        currentUser,
      ]);
    }
    // if the number of rows returned is less than the limit then there is no more forum feed to fetch
    if (returnedFeed.rowCount <= limit) {
      morePosts = false;
    }
    // this is new code -> test this later -> should output the
    let avatarUrl = null;
    for (let i = 0; i < returnedFeed.rowCount; i++) {
      const row = returnedFeed.rows[i];
      if (row.fld_profile_pic) {
        const key = row.fld_profile_pic.includes("/")
          ? row.fld_profile_pic
          : `avatars/${row.fld_profile_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        avatarUrl = await getSignedFile(folder, fileName); // fresh 12h URL, every rerender refreshes timer
        row.fld_profile_pic = avatarUrl;
      }
    }
    // return the posts and whether there is more data to fetch
    res.status(200).json({
      hasMore: morePosts,
      newFeed: returnedFeed.rows.slice(0, limit),
    });
  } catch (e) {
    console.log("Error when loading forum feed: ", e);
    res.status(500).json(e);
  }
});

// ----------- SAVED FORUMS -------------
router.get("/get-saved-forums", authenticateToken, async (req, res) => {
  const currentUser = req.userID;

  try {
    const limit = parseInt(req.query.limit); // number of posts to return -> determined by front-end
    //const queryTime = new Date(res.query.before); // which posts to query (determined by date posted)
    let query;
    let returnedFeed;

    let craftFilter = req.query.craft;

    // need to check if there was a timestamp passed from the frontend (used to sort feed and keep consistent)
    query = `
    SELECT u.fld_username, u.fld_profile_pic, ff.fld_header, ff.fld_body, ff.fld_pic, CAST(ff.fld_timestamp AS TIMESTAMPTZ) , ff.fld_post_pk
    FROM login.tbl_user AS u 
    INNER JOIN forums.tbl_forum_post AS ff 
        ON u.fld_user_pk = ff.fld_creator
        INNER JOIN forums.tbl_forum_tag AS tr
          ON ff.fld_post_pk = tr.fld_post
          INNER JOIN tags.tbl_tags AS tt
            ON tr.fld_tag = tt.fld_tags_pk
            INNER JOIN forums.tbl_save_forum AS sf
              ON ff.fld_post_pk = sf.fld_post_fk
    WHERE tt.fld_tag_name = ANY($2) AND sf.fld_user_fk = $3 AND u.fld_user_pk <> $3
    ORDER BY sf.fld_time_saved DESC, sf.fld_post_fk DESC
    LIMIT $1;
    `;
    // note: chanfed fld_time_saved to fld_timestamp to match type values on front-end

    returnedFeed = await pool.query(query, [
      limit,
      "{" + craftFilter.join(",") + "}",
      currentUser,
    ]);
    // this is new code -> test this later -> should output the
    let avatarUrl = null;
    for (let i = 0; i < returnedFeed.rowCount; i++) {
      const row = returnedFeed.rows[i];
      if (row.fld_profile_pic) {
        const key = row.fld_profile_pic.includes("/")
          ? row.fld_profile_pic
          : `avatars/${row.fld_profile_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        avatarUrl = await getSignedFile(folder, fileName); // fresh 12h URL, every rerender refreshes timer
        row.fld_profile_pic = avatarUrl;
      }
    }
    // return the posts and whether there is more data to fetch
    res.status(200).json({
      newFeed: returnedFeed.rows.slice(0, limit),
    });
  } catch (e) {
    console.log("Error when loading forum feed: ", e);
    res.status(500).json(e);
  }
});



//create forum post
router.post("/forum-post", upload.single("file"), authenticateToken, async (req, res) => {
  try {
    console.log(req.body);

    data = JSON.parse(req.body.data);

    //obtain thy variables
    const { filter, title, content, tags } = data

    console.log(filter, title, content, tags)

    if (typeof filter === undefined || filter.length == 0) {
      res.status(403).json({message: "filter needs to be filled"});
      return;
    }

    if (content.length == 0 || title.length == 0 || content.length > 10000 || title.length > 150) {
      res.status(403).json({message: "Cannot have empty fields"});
      return;
    }

    //need this for later
    let tag_ids = [];
    
    //dates in UTC
    const now = new Date();
    const date = now.toISOString();

    //get ID
    query = `
    SELECT fld_tags_pk
    FROM tags.tbl_tags
    WHERE fld_tag_name = $1;
    `
    const filterID = await pool.query(query, [filter]);

    if (filterID.rowCount < 1) {
      res.status(404).json({message: "filter tag does not exist"});
      return;
    }

    console.log("filter ID: ", filterID.rows[0].fld_tags_pk);
    tag_ids.push(filterID.rows[0].fld_tags_pk);


    //insert new tags (if they don't already exist)
    for (let tag of tags) {
      //lowercase -> should not affect non-alpha chars
      tag = tag.toLowerCase()

      //no dup tags regardless of what the filter is
      if (tag == "crochet" || tag == "knit" || tag == "misc" || tag == "miscellaneous") {
        continue;
      }

      let color = generateColor();
      console.log("color: ", color);

      //we're inserting tags into db & checking if they exist or not
      query = `
      INSERT INTO tags.tbl_tags(fld_tag_name, fld_tag_color)
      VALUES($1, $2)
      ON CONFLICT (fld_tag_name) DO NOTHING;
      `
      await pool.query(query, [tag, color]);

      //fetch tagID, regardless if it's newly inserted or not
      query = `
      SELECT fld_tags_pk
      FROM tags.tbl_tags
      WHERE fld_tag_name = $1;
      `
      let tagID = await pool.query(query, [tag]);
      tag_ids.push(tagID.rows[0].fld_tags_pk);
    }
    console.log("inserted tags");


    //if image was uploaded -> check because image is optional
    if (req.file) {
      console.log("[create forum post]: going the image route");


      //upload file & create new post
      const ext = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      }[req.file.mimetype] ||
      path.extname(req.file.originalname || "").replace(/^\./, "") ||
      "jpg";
      
      //S3 variablesss
      const folderName = "forum_posts";
      const fileName = `${req.userID.trim()}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

      //upload file to S3
      await uploadFile(req.file.buffer, fileName, folderName, req.file.mimetype);
      console.log(`[forum post creation] uploaded ${folderName}/${fileName} to S3`);


      //create new post
      query = `
      INSERT INTO forums.tbl_forum_post (fld_creator, fld_header, fld_body, fld_pic, fld_timestamp)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING fld_post_pk;
      `
      const postID = await pool.query(query, [req.userID.trim(), title, content, `${folderName}/${fileName}`, date]);

      //create tag-post relationship
      query = `
      INSERT INTO forums.tbl_forum_tag(fld_post, fld_tag)
      VALUES ($1, $2)
      ON CONFLICT (fld_post, fld_tag) DO NOTHING;
      `

      //insert tags into many to many relationship
      for (let i = 0; i < tag_ids.length; i++) {
        console.log("POST ID: ", postID.rows[0].fld_post_pk, "TAGS ID:", tag_ids[i]);
        await pool.query(query, [postID.rows[0].fld_post_pk, tag_ids[i]]);
      }

      console.log("successful post creation");
      res.status(200).json({message: "successful post creation"})
    }

    else {
      console.log("[create forum post]: going the non-image route")
      //create new post
      query = `
      INSERT INTO forums.tbl_forum_post (fld_creator, fld_header, fld_body, fld_timestamp)
      VALUES ($1, $2, $3, $4)
      RETURNING fld_post_pk;
      `

      const postID = await pool.query(query, [req.userID.trim(), title, content, date]);
      console.log("[create forum post]: created post and fetched ID");

      //create tag-post relationship


      //insert tags into many to many relationship
      for (let i = 0; i < tag_ids.length; i++) {
        query = `
        INSERT INTO forums.tbl_forum_tag(fld_post, fld_tag)
        VALUES ($1, $2)
        ON CONFLICT (fld_post, fld_tag) DO NOTHING;
        `
        console.log("POST ID: ", postID.rows[0].fld_post_pk, "TAGS ID:", tag_ids[i]);
        await pool.query(query, [postID.rows[0].fld_post_pk, tag_ids[i]]);
      }


      console.log("successful post creation");
      res.status(200).json({message: "successful post creation"})
    }
  }

  catch(error) {
    console.log("Error creating post: ", error)
    res.status(500).json(error)
  }
})



// ------------------------- LOAD SINGLE POST ----------------------
router.get("/get-single-post", authenticateToken, async (req, res) => {
  const postID = req.query.id;
  try {
    //query for the post data
    let query;
    let returnedPostInfo;

    query = `
    SELECT p.fld_post_pk AS id, 
            p.fld_header AS title, 
            p.fld_body AS content, 
            p.fld_pic AS imageuri, 
            CAST(p.fld_timestamp AS TIMESTAMPTZ) AS dateposted, 
            u.fld_username AS username, 
            u.fld_profile_pic AS profileuri, 
            p.fld_creator AS creator
    FROM forums.tbl_forum_post AS p
    INNER JOIN login.tbl_user AS u 
      ON p.fld_creator = u.fld_user_pk
    WHERE p.fld_post_pk = $1;
    `

    returnedPostInfo = await pool.query(query, [postID]);

    //make sure post exists (aka something was actually returned)
    if (returnedPostInfo.rowCount === 0){
      res.status(404);
    }

    if (returnedPostInfo.rowCount > 1) {
      console.log("Query returned more than 1 row. Not possible for a single post")
      res.status(500);
    }

    let avatarUrl = null;
    for (let i = 0; i < returnedPostInfo.rowCount; i++) {
      const row = returnedPostInfo.rows[i];
      if (row.profileuri) {
        const key = row.profileuri.includes("/")
          ? row.profileuri
          : `avatars/${row.profileuri}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        avatarUrl = await getSignedFile(folder, fileName); // fresh 12h URL, every rerender refreshes timer
        row.profileuri = avatarUrl;
      }
    }

    res.status(200).json({
      postInfo: returnedPostInfo.rows[0],
      currentUser: req.userID
    })
    //send post data back
  } catch (e) {
    console.log("Error when loading the single post information", e)
  }
})

// ------------------------- FORUM COMMENTS -----------------------
router.get("/get-post-comments", authenticateToken, async (req, res) => {
  function buildCommentsTree(flatList) {
    const nodeMap = {};
    const rootNodes = [];
    flatList.forEach((item) => {
      nodeMap[item.id] = { ...item, children: [] };
    });

    flatList.forEach((item) => {
      const node = nodeMap[item.id];
      if (item.parentid !== null) {
        nodeMap[item.parentid].children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  try {
    const filterPostID = req.query.id;
    let query;
    let returnedComments;
    let hasMore = true;
    if ((req.query.before === "undefined") | (req.query.before === "null") | (!req.query.before)){
      query = `
      WITH RECURSIVE postComments AS (
        (SELECT c.fld_comment_pk AS id, 
                c.fld_post AS postID, 
                c.fld_commenter AS commenterID, 
                c.fld_parent_comment AS parentID, 
                c.fld_comment_depth AS depth, 
                c.fld_body AS text, 
                CAST (c.fld_timestamp AS TIMESTAMPTZ) AS date, 
                u.fld_username AS username, 
                u.fld_profile_pic AS profileURI
        FROM forums.tbl_forum_comment c
        JOIN login.tbl_user u ON c.fld_commenter = u.fld_user_pk
        WHERE fld_post = $1 AND fld_parent_comment IS NULL
        ORDER BY c.fld_timestamp DESC
        LIMIT 11)
        UNION ALL
          SELECT  c.fld_comment_pk AS id, 
                  c.fld_post AS postID, 
                  c.fld_commenter AS commenterID, 
                  c.fld_parent_comment AS parentID, 
                  c.fld_comment_depth AS depth, 
                  c.fld_body AS text, 
                  CAST (c.fld_timestamp AS TIMESTAMPTZ) AS date, 
                  u.fld_username AS username, 
                  u.fld_profile_pic AS profileURI
          FROM forums.tbl_forum_comment c
          JOIN login.tbl_user u ON c.fld_commenter = u.fld_user_pk
          INNER JOIN postComments p ON p.id = c.fld_parent_comment
      ) SELECT * FROM postComments
      ORDER BY date DESC;
      `;
      returnedComments = await pool.query(query, [filterPostID]);
    } else {
      query = `
      WITH RECURSIVE postComments AS (
        (SELECT c.fld_comment_pk AS id, 
                c.fld_post AS postID, 
                c.fld_commenter AS commenterID, 
                c.fld_parent_comment AS parentID, 
                c.fld_comment_depth AS depth, 
                c.fld_body AS text, 
                CAST (c.fld_timestamp AS TIMESTAMPTZ) AS date, 
                u.fld_username AS username, 
                u.fld_profile_pic AS profileURI
        FROM forums.tbl_forum_comment c
        JOIN login.tbl_user u ON c.fld_commenter = u.fld_user_pk
        WHERE fld_post = $1 AND fld_parent_comment IS NULL AND (fld_timestamp, fld_comment_pk) < ($2, $3)
        ORDER BY c.fld_timestamp DESC
        LIMIT 11)
        UNION ALL
          SELECT  c.fld_comment_pk AS id, 
                  c.fld_post AS postID, 
                  c.fld_commenter AS commenterID, 
                  c.fld_parent_comment AS parentID, 
                  c.fld_comment_depth AS depth, 
                  c.fld_body AS text, 
                  CAST(c.fld_timestamp AS TIMESTAMPTZ) AS date, 
                  u.fld_username AS username, 
                  u.fld_profile_pic AS profileURI
          FROM forums.tbl_forum_comment c
          JOIN login.tbl_user u ON c.fld_commenter = u.fld_user_pk
          INNER JOIN postComments p ON p.id = c.fld_parent_comment
      ) SELECT * FROM postComments
      ORDER BY date DESC;
      `;
      returnedComments = await pool.query(query, [filterPostID, req.query.before, req.query.commentID]);
    }

    let avatarUrl = null;
    for (let i = 0; i < returnedComments.rowCount; i++) {
      const row = returnedComments.rows[i];
      if (row.profileuri) {
        const key = row.profileuri.includes("/")
          ? row.profileuri
          : `avatars/${row.profileuri}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/");
        avatarUrl = await getSignedFile(folder, fileName); // fresh 12h URL, every rerender refreshes timer
        row.profileuri = avatarUrl;
      }
    }

    let commentsTree = buildCommentsTree(returnedComments.rows);
    if (commentsTree.length <= 10) {
      hasMore = false;
    }
    res.status(200).json({
      commentTree: commentsTree.slice(0, 10),
      hasMore: hasMore,
    });
  } catch (e) {
    console.log("Error when retrieving comments for single forum posts", e);
  }
});

router.post("/forum-comment-post", authenticateToken, async (req, res) => {
  const currentUser = req.userID;
  const sentData = req.body;
  const { postID, parentID, depth, body, timestamp} = sentData;
  try {
    let query;
    let postComment;
    query = `
    INSERT INTO forums.tbl_forum_comment (fld_post, fld_commenter, fld_parent_comment, fld_comment_depth, fld_body, fld_timestamp)
    VALUES ($1, $2, $3, $4, $5, $6)
    `;
    postComment = await pool.query(query, [postID, currentUser, parentID, depth, body, timestamp]);

    console.log("Successfully entered the new comment!");
    res.status(200).send("Ok");
  } catch (e) {
    console.log("Error when inserting new comment to a forum post", e)
    res.status(500).send("Error");
  }


})

// Deleting a comment
router.delete("/forum-comment-delete", authenticateToken, async (req, res) => {
  const currentUser = req.userID;
  const sentData = req.body;
  const { commenterID, commentID, hasChildren, hasParent, pathArray, postID } = sentData;

  let checkParent;
  let rootID;
  const numCommentID = parseInt(commentID);
  if (Array.isArray(pathArray)){
    rootID = parseInt(pathArray[pathArray.length - 1]);
  } else {
    rootID = pathArray;
  }

  //double check the user has access to delete the comment
  if (currentUser !== commenterID) {
    console.log("User does not have access to delete this comment")
    return res.status(403).json({message: "This user does not have access to delete this comment"});
  }

  try {
    let query;
    let confirmComment;
    let count = 0;
    let continueSearch = true;

    //double check that the comment exists
    query = `
    SELECT *
    FROM forums.tbl_forum_comment
    WHERE fld_comment_pk = $1 AND fld_commenter = $2;
    `

    confirmComment = await pool.query(query, [numCommentID, commenterID]);

    if (confirmComment.rowCount < 1){
      console.log("Could not find the comment to delete")
      return res.status(404).json({message: "Could not find the comment to delete"})
    }

    //Get all comments that have a relationship to comment to delete (any children, parents, grandparents, etc.)
    query = `
    WITH RECURSIVE postComments AS (
      (SELECT fld_comment_pk AS id, 
              fld_post AS postID, 
              fld_commenter AS commenterID, 
              fld_parent_comment AS parentID, 
              fld_comment_depth AS depth, 
              fld_body AS text, 
              CAST (fld_timestamp AS TIMESTAMPTZ) AS date
      FROM forums.tbl_forum_comment 
      WHERE fld_post = $1 AND fld_comment_pk = $2
      ORDER BY fld_timestamp DESC
      LIMIT 11)
      UNION ALL
        SELECT  fld_comment_pk AS id, 
                fld_post AS postID, 
                fld_commenter AS commenterID, 
                fld_parent_comment AS parentID, 
                fld_comment_depth AS depth, 
                fld_body AS text, 
                CAST (fld_timestamp AS TIMESTAMPTZ) AS date
        FROM forums.tbl_forum_comment
    INNER JOIN postComments p ON p.id = fld_parent_comment
    ) SELECT * FROM postComments
    ORDER BY date DESC;
    `;


    const commentSubset = await pool.query(query, [postID, rootID])
    const commentSubsetRows = commentSubset.rows;

    // function to determine if all children of a passed node are deleted (returns true or false)
    function areAllChildrenDeleted(commentsToCheck, commentToDeleteID) {
        const arrChildren = commentsToCheck.filter(item => parseInt(item.parentid) === parseInt(commentToDeleteID));
        if (!arrChildren.length) return true;
        return arrChildren.every((x) => {
          if (parseInt(x.id) === parseInt(pathArray[0])){
            return true;
          }
          return (x.text === 'This comment has been deleted' && areAllChildrenDeleted(commentsToCheck, x.id))
        });
    }

    //function to delete the subtree from a given node and down
    async function deleteSubtree (rootToDelete) {
      query = `
      WITH RECURSIVE postComments AS (
        (SELECT fld_comment_pk, fld_parent_comment
        FROM forums.tbl_forum_comment 
        WHERE fld_post = $1 AND fld_comment_pk = $2)
        UNION ALL
          SELECT  c.fld_comment_pk, c.fld_parent_comment
          FROM forums.tbl_forum_comment c
		  INNER JOIN postComments p ON p.fld_comment_pk = c.fld_parent_comment
      ) DELETE FROM forums.tbl_forum_comment WHERE fld_comment_pk IN (SELECT fld_comment_pk FROM postComments);
      `

      await pool.query(query, [postID, rootToDelete]);
    }

    //function to update text to node (could not delete node, so update text)
    async function updateText (idToUpdate) {
      query = `
      UPDATE forums.tbl_forum_comment
      SET fld_body = 'This comment has been deleted'
      WHERE fld_comment_pk = $1 AND fld_commenter = $2
      `
      await pool.query(query, [idToUpdate, commenterID])
    }

    //case 1 -> node has no parent but has children (root comment with replies)
      //call function to check if all children are deleted
        // if true -> delete whole tree
        // if false -> update text
    if (!hasParent && hasChildren){
      if (areAllChildrenDeleted(commentSubsetRows, rootID)){
        deleteSubtree(rootID);
      } else {
        updateText(rootID);
      }
    }

    //case 2 -> node has parent but no children (last reply comment)
      // go to parent node
      // check if all children are deleted 
        //if yes, go to next parent
        //if no, go back down to previous node and delete
    if (hasParent && !hasChildren){
      count++;
      while (count < pathArray.length){
        checkParent = commentSubsetRows.find(node => node.id === pathArray[count]);
        if (checkParent.text !== 'This comment has been deleted'){
          break;
        }
        continueSearch = areAllChildrenDeleted(commentSubsetRows, parseInt(pathArray[count]));
        if (continueSearch){
          count++;
        } else {
          break;
        }
      }
      deleteSubtree(parseInt(pathArray[count - 1]))
    }

    //case 3 -> Node with parent and children (a reply with replies)
      // check if all children are deleted
        //if yes, go to parent
        //if no on first node, update text
        //if no on a parent node, delete tree from previous node
    if (hasParent && hasChildren){
      while (count < pathArray.length) {
        checkParent = commentSubsetRows.find(node => node.id === pathArray[count])
        if (checkParent.text !== 'This comment has been deleted'){
          break;
        }
        continueSearch = areAllChildrenDeleted(commentSubsetRows, parseInt(pathArray[count]))
        if (continueSearch) {
          count++
        } else {
          break;
        }
      }
      if (count === 0){
        updateText(parseInt(pathArray[0]));
      } else {
        deleteSubtree(parseInt(pathArray[count - 1]));
      }
    }

    //case 4 -> node has no parent or children (a single comment no replies)
      // delete the comment 
    if (!hasChildren && !hasParent){
      //only delete if the comment has no children
      //delete the comment
      query = `
      DELETE FROM forums.tbl_forum_comment
      WHERE fld_comment_pk = $1 AND fld_commenter = $2;
      `
      await pool.query(query, [numCommentID, commenterID]);
    }
    
    console.log("successfully deleted the comment!");
    return res.status(200).json({message: "Comment was successfully deleted"})

  } catch (e) {
    console.log("Error when trying to delete forum comment", e);
    res.status(500).json(e)
  }

})

router.patch("/forum-update-comment", authenticateToken, async (req,res) => {
  const {newText, commentID} = req.body;
  //check if comment exists
  try {
    let query;
    query = `
      SELECT *
      FROM forums.tbl_forum_comment
      WHERE fld_comment_pk = $1;
    `
    commentExists = await pool.query(query, [commentID]);
    if (commentExists.rowCount !== 1){
      console.log("Could not find the comment to update")
      res.status(404).json(e);
    }

    query = `
      UPDATE forums.tbl_forum_comment
      SET fld_body = $1
      WHERE fld_comment_pk = $2;
      `

    await pool.query(query, [newText, commentID]);

    console.log("Successfully updated comment text");
    res.status(200).json({message: "Comment was successfully updated"})
  } catch (e) {
    console.log("Error when updating comment text", e);
    res.status(500).json(e);
  }
})



//edit forum post
router.patch("/forum_post/:forumID", authenticateToken, async (req, res) => {
  try {
    const { forumID } = req.params;
    const { header, body } = req.body;

    //check if person actually has permission to delete
    //can alter this when we add mod perms
    query = `
    SELECT *
    FROM forums.tbl_forum_post
    WHERE fld_post_pk = $1 AND fld_creator = $2;
    `

    const post = await pool.query(query, [forumID, req.userID.trim()]);

    if (post.rowCount == 0) {
      //do not have permission to edit post
      console.log("[forums]: No permissions to edit post")
      res.status(403).json({message: "Forbidden: Do not have permission to edit post"})
    }
    else if (header.length == 0 || body.length == 0 || header.length > 150 || body.length > 10000) {
      //if header or body too big or small (if we just skip the frontend altogether and just send API requests)
      console.log("[forums]: header or body length is too big or small")
      res.status(403).json({message: "Forbidden: header or body length does not fit size requirements"})
    }
    else {
      //make new timestamp in UTC
      const now = new Date();
      const date = now.toISOString();

      //else, edit contents of post
      query = `
      UPDATE forums.tbl_forum_post
      SET fld_header = $1, fld_body = $2, fld_timestamp = $3, fld_edited = TRUE
      WHERE fld_post_pk = $4 AND fld_creator = $5
      RETURNING *;
      `

      const updated_post = await pool.query(query, [header, body, date, forumID, req.userID.trim()])

      if (updated_post.rowCount == 0) {
        console.log("[forums]: Error editing forum in query")
        res.status(500).json({message: "Failed to edit forum"})
      }
      else {
        console.log("[forums]: Successfully updated forum!")
        res.status(200).json(updated_post.rows[0])
      }
    }

  }
  catch(error) {
    console.log("Error editing forum: ", error)
    res.status(500).json(error)
  }
})



//delete forum post
router.delete("/forum_post/:forumID", authenticateToken, async (req, res) => {
  try {
    const { forumID } = req.params;

    //check if person actually has permission to delete
    //can alter this when we add mod perms
    
    query = `
    SELECT *
    FROM forums.tbl_forum_post
    WHERE fld_post_pk = $1 AND fld_creator = $2;
    `

    const post = await pool.query(query, [forumID, req.userID.trim()]);

    if (post.rowCount == 0) {
      console.log("No permissions to edit post")
      res.status(403).json({message: "Do not have permission to edit post"})
    }
    else {
      //delete images (if exist) first from S3
      query = `
      SELECT fld_pic
      FROM forums.tbl_forum_post
      WHERE fld_post_pk = $1 AND fld_pic IS NOT NULL;
      `

      let image_key = await pool.query(query, [forumID]);

      //delete forum post contents but keep primary key, timestamp, and user_id
      //will wait to delete forum image later if we have issues deleting post but not image
      query = `
      UPDATE forums.tbl_forum_post
      SET fld_header = $1, fld_body = $2, fld_pic = NULL, fld_edited = FALSE
      WHERE fld_post_pk = $3
      RETURNING *;
      `

      const delete_post = await pool.query(query, ["[deleted]", "[deleted]", forumID])

      if (delete_post.rowCount == 0) {
        console.log("did not find post")
        res.status(404).json({message: "Forum post does not exist"})
        return;
      }

      //now image deletion time
      if (image_key.rowCount != 0) {
        image_key = image_key.rows[0].fld_pic
        console.log("[forums]: image we need to delete: ", image_key)

        //get variables
        const fullKey = image_key.includes("/") ? image_key : `forum_posts/${image_key}`;
        const folderName = fullKey.split("/")[0];
        const fileName = fullKey.split("/").slice(1).join("/");

        console.log("[forums]: delete forum image in process. foldername, filename ", folderName, fileName)

        //delete images (hopefully)
        await deleteFile(fileName, folderName);

        console.log("[forums] successful deletion of post image")
      }

      res.status(200).json({message: "successful deletion of post!"})
    }

  }
  catch(error) {
    console.log("Error deleting forum post: ", error)
    res.status(500).json(error)
  }
})



module.exports = router;
