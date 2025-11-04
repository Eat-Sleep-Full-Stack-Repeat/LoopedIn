const express = require("express");
const router = express.Router();
const { pool } = require("../backend_connection");

//jwt-checker before revealing any sensitive info
const authenticateToken = require("../middleware/authenticate");
const { getSignedFile, uploadFile } = require("../s3_connection");

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
      return cb(new Error("Unsupported file type. Use jpg, png, webp, or gif."));
    }
    cb(null, true);
  },
});

//------------------------ FORUMS -------------------------------


// ----------- RECENT FORUMS -------------
//get request -> return a list of forums
// everything in req.query is from the fetch URL query
router.get("/get-forums", authenticateToken, async (req, res) => {
  console.log("reached the get request for forums");
  console.log("This is the query: ", req.query);

  const currentUser = req.userID;
  console.log("Current user is: ", currentUser);

  try {
    const limit = parseInt(req.query.limit); // number of posts to return -> determined by front-end
    //const queryTime = new Date(res.query.before); // which posts to query (determined by date posted)
    let morePosts = true; // used to check if there are any more posts (false -> front-end should stop fetching data)
    let query;
    let returnedFeed;

    console.log(`Checking timestamp ${req.query.before}`);

    let craftFilter = req.query.craft;
    console.log("Craft filter is: ", craftFilter);

    // need to check if there was a timestamp passed from the frontend (used to sort feed and keep consistent)
    if (
      (req.query.before === "undefined") |
      (req.query.before === "null") |
      !req.query.before
    ) {
      // loads the initial batch of data (no timestamp to check, just the most recent posts)
      console.log(`Inside initial loading of forum feed using ${limit}`);
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

      returnedFeed = await pool.query(query, [limit, "{" + craftFilter.join(",") + "}", currentUser]);
    } else {
      // loads more data after the initial batch (uses timestamp of last returned post to get more -> ensures working with same set of data)
      console.log("Inside the else branch");
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
        currentUser
      ]);
    }
    // if the number of rows returned is less than the limit then there is no more forum feed to fetch
    if (returnedFeed.rowCount <= limit) {
      morePosts = false;
    }
    // this is new code -> test this later -> should output the 
    let avatarUrl = null;
    for (let i = 0; i < returnedFeed.rowCount; i++){
      const row = returnedFeed.rows[i];
      if (row.fld_profile_pic){
        const key = row.fld_profile_pic.includes("/") ? row.fld_profile_pic : `avatars/${row.fld_profile_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/"); 
        avatarUrl = await getSignedFile(folder, fileName);  // fresh 12h URL, every rerender refreshes timer
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

// ----------- RECENT FORUMS -------------
router.get("/get-saved-forums", authenticateToken, async (req, res) => {
  console.log("reached the get request for saved forums");
  console.log("This is the query: ", req.query);

  const currentUser = req.userID;
  console.log("Current user is: ", currentUser);

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

    returnedFeed = await pool.query(query, [limit, "{" + craftFilter.join(",") + "}", currentUser]);
    // this is new code -> test this later -> should output the 
    let avatarUrl = null;
    for (let i = 0; i < returnedFeed.rowCount; i++){
      const row = returnedFeed.rows[i];
      if (row.fld_profile_pic){
        const key = row.fld_profile_pic.includes("/") ? row.fld_profile_pic : `avatars/${row.fld_profile_pic}`;
        const folder = key.split("/")[0];
        const fileName = key.split("/").slice(1).join("/"); 
        avatarUrl = await getSignedFile(folder, fileName);  // fresh 12h URL, every rerender refreshes timer
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
    for (const tag of tags) {
      //no dup tags regardless of what the filter is
      if (tag.toLowerCase() == "crochet" || tag.toLowerCase() == "knit") {
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
      ON CONFLICT ($1, $2) DO NOTHING;
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


module.exports = router;
