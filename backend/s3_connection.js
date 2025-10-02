//this is what our bucket has access to (in terms of operation)
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

//get env data
require("dotenv").config();

//troubleshooting if sensitive data does not exist
if (!process.env.BUCKET_NAME) {
    throw new Error("Missing bucket name.")
}
if (!process.env.BUCKET_REGION) {
    throw new Error("Missing bucket region.")
}
if (!process.env.BUCKET_ACCESS_KEY) {
    throw new Error("Missing bucket access key.")
}
if (!process.env.BUCKET_SECRET_KEY) {
    throw new Error("Missing bucket secret key.")
}

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.BUCKET_ACCESS_KEY,
        secretAccessKey: process.env.BUCKET_SECRET_KEY,
    },
    region: process.env.BUCKET_REGION
});


//push the image(s) to S3
function uploadFile(fileBuffer, fileName, folderName, mimetype) {
    const uploadParams = {
        Bucket: process.env.BUCKET_NAME,
        Body: fileBuffer,
        Key: `${folderName}/${fileName}`,
        ContentType: mimetype
    }

    return s3.send(new PutObjectCommand(uploadParams));
}

//delete the image from S3
function deleteFile(fileName, folderName) {
    const deleteParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${folderName}/${fileName}`
    }

    return s3.send(new DeleteObjectCommand(deleteParams));
}

//fetch image(s) from S3
async function getSignedFile(folderName, fileName) {
    const getParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${folderName}/${fileName}`
    }

    const command = new GetObjectCommand(getParams);

    //can change this -> right now it's 12 hours
    //max is 7 days
    const timeValid = 60 * 60 * 12;

    const url = await getSignedUrl(s3, command, { expiresIn: timeValid });

    return url;
}

module.exports = { uploadFile, deleteFile, getSignedFile };