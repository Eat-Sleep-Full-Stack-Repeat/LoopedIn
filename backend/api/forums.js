const express = require("express");
const router = express.Router();
const { pool } = require("../backend_connection");

//jwt-checker before revealing any sensitive info
const authenticateToken = require("../middleware/authenticate");

//------------------------ FORUMS -------------------------------

//get request -> return a list of forums
// everything in req.query is from the fetch URL query
router.get("/get-forums", async (req, res) => {
  console.log("reached the get request for forums");
  console.log("This is the query: ", req.query);
  try {
    const limit = parseInt(req.query.limit); // number of posts to return -> determined by front-end
    //const queryTime = new Date(res.query.before); // which posts to query (determined by date posted)
    let morePosts = true; // used to check if there are any more posts (false -> front-end should stop fetching data)
    let query;
    let returnedFeed;

    console.log(`Checking timestamp ${req.query.before}`);

    // need to check if there was a timestamp passed from the frontend (used to sort feed and keep consistent)
    if (req.query.before === "undefined" | req.query.before === "null" | !req.query.before) {
      // loads the initial batch of data (no timestamp to check, just the most recent posts)
      console.log(`Inside initial loading of forum feed using ${limit}`);
      query = `
        SELECT u.fld_username, u.fld_profile_pic, ff.fld_header, ff.fld_body, ff.fld_pic, ff.fld_timestamp, ff.fld_post_pk 
        FROM login.tbl_user AS u 
        INNER JOIN forums.tbl_forum_post AS ff 
            ON u.fld_user_pk = ff.fld_creator
        ORDER BY ff.fld_timestamp DESC, ff.fld_post_pk DESC
        LIMIT ($1 + 1);
        `;

        returnedFeed = await pool.query(query, [limit]);
    } else {
      // loads more data after the initial batch (uses timestamp of last returned post to get more -> ensures working with same set of data)
      console.log("Inside the else branch");
      query = `
        SELECT u.fld_username, u.fld_profile_pic, ff.fld_header, ff.fld_body, ff.fld_pic, ff.fld_timestamp, ff.fld_post_pk 
        FROM login.tbl_user AS u 
        INNER JOIN forums.tbl_forum_post AS ff 
            ON u.fld_user_pk = ff.fld_creator
        WHERE ROW(ff.fld_timestamp, ff.fld_post_pk) < ROW($1, $2)
        ORDER BY ff.fld_timestamp DESC, ff.fld_post_pk DESC
        LIMIT ($3 + 1);
        `;

        returnedFeed = await pool.query(query, [req.query.before, req.query.postID, limit]);
    }
    // if the number of rows returned is less than the limit then there is no more forum feed to fetch
    if (returnedFeed.rowCount <= limit) {
      morePosts = false;
    }

    console.log(JSON.stringify(returnedFeed.rows));

    console.log(
      `Has more is ${morePosts} and returning the following data to front-end: ${returnedFeed.rows}`
    );

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
