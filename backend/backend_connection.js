//setting up the connection to our database!
//is a PostgresSQL database
const {Pool}=require("pg")

//get sensitive data
require("dotenv").config()

//troubleshooting if sensitive data does not exist
if (!process.env.DB_USER) {
    throw new Error("Missing database username.")
}
if (!process.env.DB_HOST) {
    throw new Error("Missing database hostname.")
}
if (!process.env.DB_DB) {
    throw new Error("Missing database name.")
}
if (!process.env.DB_PASSWORD) {
    throw new Error("Missing database password.")
}
if (!process.env.PORT) {
    throw new Error("Missing database port.")
}

//set up database creds
const pool=new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DB,
    password: process.env.DB_PASSWORD,
    port: process.env.PORT,
    //no SSL, but need this to connect to db
    ssl: {
        rejectUnauthorized: false
    },
    keepAlive: true,
    idleTimeoutMillis: 30000, //connection can only be idle for 30 seconds
    connectionTimeoutMillis: 10000 //wait 10 seconds for another live connection at most
})

//catch econnreset error if it was globally thrown (vs per query thrown)
//if per query, pool.query should handle that with our try/catch blocks
pool.on("error", (error, client) => {
    console.error("Database connection was reset.", error)
})

//check connection to db in a different way as we got rid of the pool.connect() statement due to the
//fact we are not correctly managing all db connections previously
async function attempt() {
    try {
        //very common query (called a heartbeart query) to check connection to database
        await pool.query("SELECT 1")
        console.log("Connected to Postgres database!")
    }
    catch(error) {
        console.log("Error connecting to database:", error)
    }
}

attempt()

//exporting connection for use
module.exports={pool}