//import S3 functions for images
const { uploadFile, deleteFile, getSignedFile } = require("./s3_connection.js");


//set up express server
const express = require("express");
const app = express();

//random port number -> can change if we want something different
const port = 5000;

//connect express server to our database connection
const { pool } = require("./backend_connection");

//middleware for uploading files into S3
const multer = require('multer');

//where images go temporarily while being uploaded
//good for error checking before sending off
const storage = multer.memoryStorage();

//the upload const (along with a method that determines how many images we're sending) 
//goes inside an API endpoint
const upload = multer({storage: storage});


// -------------------- RUNNING SERVER --------------------------- 
app.listen(port, (error) => {
  //error handling for server connection
  if (!error) {
    //running our server at http://127.0.0.1:5000
    console.log(`Listening at http://localhost:${port}`);
  } else {
    console.log("Server connection error: ", error);
  }
});