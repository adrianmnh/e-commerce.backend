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



// Schema for Creating Products

const Product = mongoose.model("Product", {
	id : {
		type: Number,
		required: false,
	},
	name : {
		type: String,
		required: true,
	},
	image : {
		type: String,
		required: true,
	},
	category : {
		type: String,
		required: true,
	},
	new_price : {
		type: Number,
		required: true,
	},
	old_price : {
		type: Number,
		required: true,
	},
	date : {
		type: Date,
		default: Date.now
	},
	available : {
		type: Boolean,
		default: true,
	}

});

// const CounterSchema = new mongoose.Schema({
// 	_id: { db: String, coll: String },
// 	seq_value: Number,
//   });

//   const Counter = mongoose.model('Counter', CounterSchema);

// app.post("/addproduct", async (req, res) => {
// 	try {
// 		// Get the current value of seq_value from the counters collection
// 		// const counter = await Counter.findOneAndUpdate(
// 		// 	{ _id: { db: "e-commerce", coll: "products" } },
// 		// 	{ $inc: { seq_value: 1 } },
// 		// 	{ new: true }
// 		// );

// 		const product = new Product({
// 			// id: counter.seq_value,

// 			name: req.body.name,
// 			image: req.body.image,
// 			category: req.body.category,
// 			new_price: req.body.new_price,
// 			old_price: req.body.old_price,
// 			date: req.body.date,
// 			available: req.body.available,
// 		});

// 		// Save the product to the database
// 		await product.save();

// 		res.json({
// 			success: 1,
// 			message: "Product added successfully",
// 			id: product.id,
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			success: 0,
// 			message: "Failed to add product",
// 			error: error.message,
// 		});
// 	}
// });



app.post("/addproduct", async( req, res ) => {

	let products = await Product.find({});

	let id;
	if(products.length > 0) {
		let last_product_array = products.slice(-1);
		let last_product = last_product_array[0];
		id = last_product.id + 1;
	} else {
		id = 1;
	}

	const product = new Product({
		// id: req.body.id,
		id: id,
		name: req.body.name,
		image: req.body.image,
		category: req.body.category,
		new_price: req.body.new_price,
		old_price: req.body.old_price,
	});

	console.log(product);
	await product.save();
	console.log("Saved");
	res.json({
		success: 1,
		generated_id: product._id,
		id: product.id,
		name: product.name,
	})
})

// app.delete("/deleteallproducts", async (req, res) => {
// 	try {
// 	  await Product.deleteMany({});
// 	  res.json({
// 		success: 1,
// 		message: "All products deleted successfully",
// 	  });
// 	} catch (error) {
// 	  res.status(500).json({
// 		success: 0,
// 		message: "Failed to delete products",
// 		error: error.message,
// 	  });
// 	}
//   });


app.listen(port, (error) => {
	if(!error) {
		console.log(`Server is running on port: ${port}`);
	} else {
		console.log(`Error occurred: ${error}`);
	}
})

