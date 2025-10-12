//set up express server
const express = require("express");
const app = express();

//random port number -> can change if we want something different
const port = 5000;

//connect express server to our database connection
const { pool } = require("./backend_connection");

//middleware to handle post and put requests
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//to permit incoming data from frontend
const cors = require("cors");

//allows weird android emulator origins
const allowedOrigins = process.env.APP_ORIGINS?.split(",") || [];

//use this to avoid mixed-content warning
console.log(`Allowed origins are: ${allowedOrigins}`);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        // console.log(`listening at ${allowedOrigins[0]}`);
        // console.log(`listening at ${allowedOrigins[1]}`);
        // console.log(`listening at ${allowedOrigins[2]}`);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
); 


// -------------------------- S3 --------------------------------- 

//import S3 functions for images
const { uploadFile, deleteFile, getSignedFile } = require("./s3_connection.js");

//middleware for uploading files into S3
const multer = require('multer');

//where images go temporarily while being uploaded
//good for error checking before sending off
const storage = multer.memoryStorage();

//the upload const (along with a method that determines how many images we're sending) 
//goes inside an API endpoint
const upload = multer({storage: storage});


// ------------------ CONNECT ALL API WORK ------------------------- 

//root route to avoid "Cannot GET /" in backend terminal
app.get("/", (req, res) => {
  res.send("Server is running!");
});

//copy this format of connection for every new js file we make in the api folder
//this can be separated by feature, user vs post, ws vs HTTP, etc.
//for each new file, add an "import" and a "mount" line

//ensure file exists ("import router")
const loginProcess = require('./api/login');
const profileWork = require('./api/profile');
const secondFile = require('./api/newFeature'); //delete this example upon creation of new file


//get ready to use that bad boy ("mount")
app.use('/api/login', loginProcess);
app.use('/api/profile', profileWork);
app.use('/api/newFeature', secondFile);



// -------------------- RUNNING SERVER --------------------------- 
app.listen(port, (error) => {
  //error handling for server connection
  if (!error) {
    //running our server at http://127.0.0.1:5000
    console.log(`Backend running at http://localhost:${port}`);
  } else {
    console.log("Server connection error: ", error);
  }
});

