const https = require('https');
const express = require("express"); // Express framework for building web applications
const app = express(); // Creating an instance of the Express application
const mongoose = require("mongoose"); // Mongoose for MongoDB database connection and object modeling
const jwt = require("jsonwebtoken"); // JSON Web Token for user authentication and authorization
const multer = require("multer"); // Multer for handling file uploads
const path = require("path"); // Path module for working with file and directory paths
const cors = require("cors"); // CORS middleware for enabling cross-origin resource sharing
const fs = require('fs'); // File System module for working with the file system
const favicon = require('serve-favicon')



const config = require('./config');


// Database Connection with MongoDB
mongoose.connect(`mongodb+srv://${config.dbUsername}:${config.dbPassword}@cluster0.jnmzfx6.mongodb.net/e-commerce`);

app.use(express.json()); // Adding middleware to parse JSON data in the request body
app.use(express.static('public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

app.use(cors()); // Adding CORS middleware to allow cross-origin requests

const adminPanelRoutes = require('./admin/admin-panel');

app.use('/admin', adminPanelRoutes);

// API Creation

{/* <link rel="icon" href="/favicon.ico"> */}


app.get("/", (req, res) => {
	res.send(`
	<title>Server API</title>
	<link rel="stylesheet" type="text/css" href="/styles.css">
	<div class="container">
	<p>Express App is running</p>
	<p>NODE_ENV = ${process.env.NODE_ENV}</p>
	</div>
	`);
})

function formatDate(date) {
	const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JavaScript
	const dd = String(date.getDate()).padStart(2, '0');
	const yy = String(date.getFullYear())
	const hh = String(date.getHours()).padStart(2, '0');
	const min = String(date.getMinutes()).padStart(2, '0');
	const ss = String(date.getSeconds()).padStart(2, '0');

	return `${mm}-${dd}-${yy}_${hh}${min}${ss}`;
}

// Image Storage Engine
const multerStorage = multer.diskStorage({
	destination: "./uploads/images",
	filename: (req, file, cb) => {
		const formattedDate = formatDate(new Date());
		return cb(null, `${file.fieldname}_${formattedDate}${path.extname(file.originalname)}`);
	}
})

// Image Upload Middleware
const upload = multer({ storage: multerStorage });

// Serving Images from the Uploads Directory
app.use("/images", express.static("uploads/images"));



// Creating Upload Endpoint for Images
app.post("/upload", upload.single("product"), (req, res) => {
	// console.log(req)
	res.json({
		success: 1,
		image_url: `http://localhost:${config.port}/images/${req.file.filename}`
	})
});


// Schema for Inventroy
const InventorySchema = mongoose.Schema({
	xs: {
		type: Number,
		default: 0
	},
	s: {
		type: Number,
		default: 0
	},
	m: {
		type: Number,
		default: 0
	},
	l: {
		type: Number,
		default: 0
	},
	xl: {
		type: Number,
		default: 0
	}
});
const Inventory = mongoose.model("Inventory", InventorySchema);

// Schema for Creating Products
// const Product = mongoose.model("Product", {
const ProductSchema = mongoose.Schema({
	id: {
		type: Number,
		required: false
	},
	name: {
		type: String,
		required: true
	},
	image: {
		type: String,
		required: true
	},
	category: {
		type: String,
		required: true
	},
	description: {
		type: String,
		default: "A lightweight, usually knitted pullover sweater that is worn over a shirt, polo, or t-shirt to provide additional warmth and comfort."
	},
	inventory: {
		type: InventorySchema,
	},
	retail_price: {
		type: Number,
		required: true,
	},
	sale_price: {
		type: Number,
		// required: false,
	},
	date_added: {
		type: Date,
		default: Date.now
	},
	date_modified: {
		type: Date,
		default: Date.now
	},
	in_stock: {
		type: Number,
	},
	available: {
		type: Boolean,
		default: false
	}
});
ProductSchema.pre('save', function (next) {
	console.log('---------------------------------');
	// // Convert the inventory object to an array of counts
	// const counts = Object.values(this.inventory);
	// console.log(counts);

	// Extract the size counts from the inventory
	const count = [this.inventory.xs, this.inventory.s, this.inventory.m, this.inventory.l, this.inventory.xl].reduce((a, b) => a + b, 0);

	console.log(count);
	// Set the available property to true if any count is more than 0, false otherwise
	this.in_stock = count;
	this.available = count > 0

	// console.log('Available:', this.available);
	// console.log('---------------------------------');
	next();
});
const Product = mongoose.model("Product", ProductSchema);


// Add Product
app.post("/add_product", async (req, res) => {

	// Validate user inputs
	// if (!req.body.name || !req.body.image || !req.body.category || !req.body.retail_price || !req.body.description) {
	if (!req.body.name || !req.body.image || !req.body.category || !req.body.retail_price) {
		console.log('Missing required fields')
		return res.status(400).json({ success: 0, message: 'Missing required fields' });
	}

	if (isNaN(req.body.retail_price)) {
		console.log('Invalid price value')
		return res.status(400).send({ success: 0, error: 'Invalid retail_price value' });
	}

	let products = await Product.find({}).catch((error) => {
		console.log(error);
		return res.status(500).json({ success: 0, message: error.message });
	});

	let id;
	if (products.length > 0) {
		let last_product_array = products.slice(-1);
		let last_product = last_product_array[0];
		id = last_product.id + 1;
	} else {
		id = 1001;
	}

	const sale_price = (!req.body.sale_price || isNaN(req.body.sale_price) || req.body.sale_price <= 0) ? null : req.body.sale_price;

	const product = new Product({
		// id: req.body.id,
		id: id,
		name: req.body.name,
		image: req.body.image,
		category: req.body.category,
		// description: req.body.description,
		retail_price: req.body.retail_price,
		sale_price: sale_price,
		inventory: {
			xs: req.body.xs || 0,
			s: req.body.s || 0,
			m: req.body.m || 0,
			l: req.body.l || 0,
			xl: req.body.xl || 0,
		}
	});

	await product.save().catch((error) => {
		console.log(error);
		return res.status(500).json({ success: 0, message: error.message });
	});

	// const prod = {
	// 	_id: "60d5ec9af682f49d49d1bc9d",
	// 	name: 'Sample Product',
	// 	category: 'Sample Category',
	// 	description: 'This is a sample product.',
	// 	image: 'http://example.com/sample.jpg',
	// 	price: 100,
	// 	newPrice: 80,
	// 	inventory: {
	// 		xs: 0,
	// 		s: 0,
	// 		m: 5,
	// 		l: 0,
	// 		xl: 0,
	// 	},
	// 	dateAdded: '2022-01-01T00:00:00.000Z',
	// 	dateModified: '2022-01-01T00:00:00.000Z',
	// 	__v: 0  // This is used by Mongoose for versioning. You don't need to set this field manually.
	// }
	// const totalCount = Object.values(prod.inventory).reduce((a, b) => a + b, 0);
	const totalCount = [product.inventory.xs, product.inventory.s, product.inventory.m, product.inventory.l, product.inventory.xl].reduce((a, b) => a + b, 0);


	const productSaved = {
		id: product.id,
		name: product.name,
		category: product.category,
		available: product.available,
		count: totalCount,
	};

	console.log(product);

	res.json({
		success: 1,
		...productSaved,
	});

	// console.log(`\nProduct Saved: ${product._id} - ${product.id} - ${product.name}`);
	console.log(`\nProduct Saved:`);
})

// Delete All Products
app.delete("/delete_all_product", async (req, res) => {
	try {
		const passwordForDelete = req.body.password;

		if (passwordForDelete === config.dbDelete) {
			await Product.deleteMany({}).catch((error) => {
				console.log(error);
				return res.status(400).json({ success: 0, message: error.message });
			});
			res.status(200).json({
				success: 1,
				message: "All products deleted successfully",
			});
		} else {
			return res.status(401).json({ success: 0, message: "Unauthorized access deleting all products" });
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({
			success: 0, message: "Failed to delete products", error: error.message
		});
	}
});

// Delete Product by ID
app.delete("/remove_product", async (req, res) => {

	if (!req.body.id) {
		console.log('Missing required fields');
		return res.status(400).json({ success: 0, message: "Missing required fields" });
	}

	let product = await Product.findOneAndDelete({ id: req.body.id }).catch(error => {
		console.log(error);
		return res.status(500).json({ success: 0, message: error.message });
	});

	if (!product) {
		console.log(`Product id: ${req.body.id} not found, cannot delete.`);
		return res.status(404).json({ success: 0, message: "Product not found" });
	}

	console.log(product.image);
	const toDelete = String(product.image).replace(`http://localhost:${config.port}/images`, '');
	console.log(toDelete);


	// Function to delete image file
	const deleteImage = (imageUrl) => {
		// Get the file path from the image URL
		const imagePath = path.join(__dirname, 'uploads', 'images', imageUrl);
		console.log(imagePath);

		// Check if the file exists
		if (fs.existsSync(imagePath)) {
			// Delete the file
			fs.unlinkSync(imagePath);
			console.log(`Image ${imageUrl} deleted successfully`);
		} else {
			console.log(`****************Image ${imageUrl} not found`);
		}
	};

	// Usage example
	const imageUrl = '/images/example.jpg';
	deleteImage(imageUrl);
	deleteImage(toDelete);


	console.log(`Removed: ${req.body.id}`);
	return res.json({
		success: 1,
		id: req.body.id,
		message: "Product deleted successfully",
	})
})

// 200 OK: The request was successful, and the response body contains the representation of the requested resources.

// 204 No Content: The request was successful, but there's no representation to return (i.e. the response is empty).

// 400 Bad Request: The server could not understand the request due to invalid syntax.

// 401 Unauthorized: The client must authenticate itself to get the requested response.

// 403 Forbidden: The client does not have access rights to the content; that is, it is unauthorized, so the server is refusing to give the requested resource.

// 404 Not Found: The server can not find the requested resource.

// 500 Internal Server Error: The server has encountered a situation it doesn't know how to handle.

// 502 Bad Gateway: The server, while acting as a gateway or proxy, received an invalid response from the upstream server it accessed in attempting to fulfill the request.

// 503 Service Unavailable: The server is not ready to handle the request. Common causes are a server that is down for maintenance or that is overloaded.

const formattedProduct = (product) => {
		// Convert the Mongoose document into a plain JavaScript object
		const productObject = product.toObject();

		// Destructure the inventory object separately to exclude its _id
		const { _id: inventoryId, ...inventoryWithoutId } = productObject.inventory;

		// Replace the original inventory object with the one without _id
		productObject.inventory = inventoryWithoutId;

		// Choose the properties you want to omit from the main product object
		// const { _id, __v, id, date_added, date_modified, ...productWithoutId } = productObject;
		const { _id, __v, date_added, date_modified, ...productWithoutId } = productObject;

		return [product.id, productWithoutId];
}

// Get All Products
app.get("/all_product", async (req, res) => {

	const allProduct = await Product.find({}).catch(error => {
		console.log(error);
		return res.status(500).json({ success: 0, message: error.message });
	});

	if (!allProduct) {
		return res.status(404).json({ success: 0, message: "Unknown error fetching all products" });
	}

	if (allProduct.length === 0) {
		// return res.status(204).json();
		return res.status(200).json({ success: 0, message: "No products found", all_product: allProduct });
	}

	// const selectedProductMap = new Map(Array.from(allProduct).map(([id, product]) => {
	// 	// Choose the key-value pairs you want to send
	// 	return [id, {
	// 		id: product.id,
	// 		name: product.name,
	// 		category: product.category,
	// 	}];

	const omittedProductMap = allProduct.map((product) => {
		return formattedProduct(product);
	});

	console.log('All products fetched', Array.from(omittedProductMap.map(([id, product]) => id)))

	res.status(200).send({ success: 1, message: "Products found", all_product: omittedProductMap });

	// const prod = {
	// 	_id: "60d5ec9af682f49d49d1bc9d",
	// 	name: 'Sample Product',
	// 	category: 'Sample Category',
	// 	description: 'This is a sample product.',
	// 	image: 'http://example.com/sample.jpg',
	// 	price: 100,
	// 	newPrice: 80,
	// 	inventory: {
	// 		xs: 1,
	// 		s: 0,
	// 		m: 5,
	// 		l: 0,
	// 		xl: 0,
	// 	},
	// 	dateAdded: '2022-01-01T00:00:00.000Z',
	// 	dateModified: '2022-01-01T00:00:00.000Z',
	// 	__v: 0
	// }
})

app.get("/product/:id", async (req, res) => {

	const product = await Product.findOne({ id: req.params.id }).catch(error => {
		console.log(error);
		return res.status(500).json({ success: 0, message: error.message });
	});

	if (!product) {
		return res.status(404).json({ success: 0, message: "Product not found" });
	}

	console.log('1 Product fetched', product.id);

	const omittedProduct = formattedProduct(product);

	res.status(200).json({ success: 1, message: "Product found", product: omittedProduct });
})


// Schema Creating for User model
const User = mongoose.model("User", {
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	cartData: {
		type: Object,
	},
	date: {
		type: Date,
		default: Date.now,
	}
})

// Creating Endpoint for Registering Users
app.post('/signup', async (req, res) => {

	if (!req.body.username || !req.body.email || !req.body.password) {
		const errorMessage = "400: Missing required fields";
		console.log(errorMessage);
		return res.status(400).json({ success: 0, message: errorMessage });
	}

	let check = await User.findOne({ email: req.body.email }).catch((error) => {
		const errorMessage = `500: ${error.message}`;
		console.log(errorMessage);
		return res.status(500).json({ success: 0, message: errorMessage });
	});

	if (check) {
		const errorMessage = "409: Email is already in use";
		console.log(errorMessage);
		return res.status(409).json({ success: 0, message: errorMessage });
	}
	let cart = {};

	for (let i = 0; i < 30; i++) {
		cart[i] = 0;
	}

	const user = new User({
		name: req.body.username,
		email: req.body.email,
		password: req.body.password,
		cartData: cart,
	})

	await user.save().catch((error) => {
		const errorMessage = `500: ${error.message}`;
		console.log(errorMessage);
		return res.status(500).json({ success: 0, message: errorMessage });
	}).then(res => {
		console.log(`User: ${user.email} saved successfully`);
	})

	const data = {
		user: {
			id: user.id
		}
	}

	console.log(data);

	const token = jwt.sign(data, 'secret_ecomm');

	res.json({ success: 1, token })
})


// Creating Endpoint for User Login
app.post('/login', async (req, res) => {
	if (!req.body.email || !req.body.password) {
		const errorMessage = "400: Missing required fields";
		console.log(errorMessage);
		return res.status(400).json({ success: 0, message: errorMessage });
	}

	let user = await User.findOne({ email: req.body.email }).catch((error) => {
		const errorMessage = `500: ${error.message}`;
		console.log(errorMessage);
		return res.status(500).json({ success: 0, message: errorMessage });
	});

	if (!user) {
		const errorMessage = "404: User not found";
		console.log(errorMessage);
		return res.status(404).json({ success: 0, message: errorMessage });
	}

	const passCompare = req.body.password === user.password;
	if (!passCompare) {
		const errorMessage = "401: Invalid password";
		console.log(errorMessage);
		return res.status(401).json({ success: 0, message: errorMessage });
	}

	const data = {
		user: {
			id: user.id
		}
	}

	const token = jwt.sign(data, 'secret_ecomm');
	console.log("Login successful");
	res.json({ success: 1, token });
});


app.get("/new_collections", async (req, res) => {
	let products = await Product.find({});
	let newCollections = products.slice(1).slice(-8);
})



const date = new Date();


if (process.env.NODE_ENV === 'production') {
	// Production server setup
	const options = {
		// Your HTTPS options here (e.g., SSL certificate paths)
		key: fs.readFileSync('/etc/letsencrypt/live/backend.ecomm.adriannyc.dev/privkey.pem'),
		cert: fs.readFileSync('/etc/letsencrypt/live/backend.ecomm.adriannyc.dev/fullchain.pem')
	};
	https.createServer(options, app).listen(config.port, (error) => {
		if (!error) {
			console.log(`Server is running on port: ${config.port}`);
			console.log('Startup date', formatDate(date)); // Outputs the date in mmddyy_hhmmss format
			console.log(`NODE_ENV = ${process.env.NODE_ENV}`);
		} else {
			console.error("Server failed to start");
		}
	});
} else {
	// Development server setup
	app.listen(config.port, (error) => {
		if (!error) {
			console.log(`Server is running on port: ${config.port}`);
			console.log('Startup date', formatDate(date)); // Outputs the date in mmddyy_hhmmss format
			console.log(`NODE_ENV = ${process.env.NODE_ENV}`);
		} else {
			console.error("Server failed to start");
		}
	});
}

process.on("uncaughtException", (error) => {
	console.log(error);
	process.exit(1);
});