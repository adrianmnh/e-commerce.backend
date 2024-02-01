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
const dbDelete = process.env.DB_DELETE;

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

// Add Product
app.post("/addproduct", async( req, res ) => {

	// Validate user inputs
	if (!req.body.name || !req.body.image || !req.body.category || !req.body.old_price || !req.body.new_price) {
		return res.status(400).json({ success: 0, message: 'Missing required fields' });
	}
	let products = await Product.find({}).catch((error) => {
		console.log(error);
		return res.status(500).json({ success: 0, message: error.message });
	});

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
		old_price: req.body.old_price,
		new_price: req.body.new_price,
	});

	await product.save().catch( (error) => {
		console.log(error);
		return res.status(500).json({ success: 0, message: error.message });
	} );

	res.json({
		success: 1,
		generated_id: product._id,
		id: product.id,
		name: product.name,
	})

	console.log(`Saved: ${product._id} - ${product.id} - ${product.name}`);
})

// Delete All Products
app.delete("/deleteallproducts", async (req, res) => {
	try {
		const passwordForDelete = req.body.password;

		if (passwordForDelete === dbDelete) {
			await Product.deleteMany({}).catch( (error) => {
				console.log(error);
				return res.status(500).json({ success: 0, message: error.message });
			});
			res.json({
				success: 1,
				message: "All products deleted successfully",
			});
		} else {
			return res.status(401).json({ success: 0, message: "Unauthorized access deleting all products" });
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({
			success: 0, message: "Failed to delete products", error: error.message });
	}
});

// Delete Product by ID
app.delete("/removeproduct", async ( req, res ) => {

	if (!req.body.id) {
		return res.status(400).json({ success: 0, message: "Missing required fields" });
	}

	let product = await Product.findOneAndDelete({ id: req.body.id }).catch( error => {
		console.log(error);
		return res.status(500).json({ success: 0, message: error.message });
	});

	if(!product) {
		console.log(`Product id: ${req.body.id} not found, cannot delete.`);
		return res.status(404).json({ success: false,	message: "Product not found" });
	}
	console.log(`Removed: ${req.body.id}`);
	return res.json({
		success: true,
		id: req.body.id,
		message: "Product deleted successfully",
	})
})

// Get All Products
app.get("/allproducts", async ( req, res ) => {
	const allProducts = await Product.find({}).catch( error => {
		console.log(error);
		return res.status(500).json({ success: 0, message: error.message });
	});

	if (!allProducts) {
		return res.status(404).json({ success: 0, message: "Unknown error fetching all products" });
	}

	if(allProducts.length === 0) {
		return res.status(404).json({ success: 0, message: "No products found" });
	}

	console.log(`All products fetched: ${allProducts.length} products`);
	// console.log(allProducts.map((product) => `id: ${product.id}: ${product.name}`));
	res.send(allProducts);
})

app.listen(port, (error) => {
	if (!error) {
		console.log(`Server is running on port: ${port}`);
	} else {
		console.log("Server failed to start");
	}
});

process.on("uncaughtException", (error) => {
	console.log(error);
	process.exit(1);
});
