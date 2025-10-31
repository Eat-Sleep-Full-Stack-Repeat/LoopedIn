const express = require("express");
const router = express.Router();
const { pool } = require("../backend_connection");

//jwt-checker before revealing any sensitive info
const authenticateToken = require("../middleware/authenticate");
const { getSignedFile } = require("../s3_connection");

//------------------------ FORUMS -------------------------------

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

module.exports = router;
