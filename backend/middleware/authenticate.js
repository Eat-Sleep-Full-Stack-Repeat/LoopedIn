//set up jwt requirement and load env key
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: '../.env' }); //env is not in api folder lol
const key = String(process.env.JWT_KEY);

//------------------------ AUTH -------------------------------

//JWT: check token before allowing access to personal contents
const authenticateToken = (req, res, next) => {
  console.log("authenticating token...");
  
  //access denied if no token / broken token (ha ha... it rhymes)
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
      return res.status(403).json({ error: "Access denied, please log in and try again." });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
      return res.status(403).json({ error: "Access denied, please try again." });
  }

  //verify good token
  jwt.verify(token, key, (err, decoded) => {
      if (err) {
          console.error("Token verification failed (probably a logout issue):", err.message);          
          return res.status(403).json({ error: "Invalid token" });
      }
    
      //keep userID for future use
      req.userID = String(decoded.userID);
      next();
  });
};

module.exports = authenticateToken;
