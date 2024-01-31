const port = 4000;

const express = require("express"); // Express framework for building web applications
const app = express(); // Creating an instance of the Express application
const mongoose = require("mongoose"); // Mongoose for MongoDB database connection and object modeling
const jwt = require("jsonwebtoken"); // JSON Web Token for user authentication and authorization
const multer = require("multer"); // Multer for handling file uploads
const path = require("path"); // Path module for working with file and directory paths
const cors = require("cors"); // CORS middleware for enabling cross-origin resource sharing
const dotenv = require("dotenv"); // Dotenv for loading environment variables from a .env file into process.env
dotenv.config(); // Loading environment variables from a .env file into process.env
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

app.use(express.json()); // Adding middleware to parse JSON data in the request body
app.use(cors()); // Adding CORS middleware to allow cross-origin requests


// Database Connection with MongoDB
mongoose.connect(`mongodb+srv://${dbUsername}:${dbPassword}@cluster0.jnmzfx6.mongodb.net/e-commerce`);

// API Creation

app.get("/", ( req, res ) => {
	res.send("Express App is running")
})

// Image Storage Engine
const multerStorage = multer.diskStorage({
	destination: "./uploads/images",
	filename: ( req, file, cb ) => {
		return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
	}
})

// Image Upload Middleware
const upload = multer( {storage: multerStorage} );

// Serving Images from the Uploads Directory
app.use("/images", express.static("uploads/images"));

// Creating Upload Endpoint for Images
app.post("/uploads", upload.single("product"), ( req, res ) => {
	res.json( {
		success: 1,
		image_url: `http://localhost:${port}/images/${req.file.filename}`
	})
});


app.listen(port, (error) => {
	if(!error) {
		console.log(`Server is running on port: ${port}`);
	} else {
		console.log(`Error occurred: ${error}`);
	}
})

