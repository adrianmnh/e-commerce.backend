// admin-panel.js
const express = require('express');
const router = express.Router();
const AdminUser = require('./user');
const config = require('../config');
const bcrypt = require('bcryptjs');


// Add your admin panel routes here
router.get("/", (req, res) => {
	res.send(`
	<title>Admin API</title>
	<link rel="stylesheet" type="text/css" href="/styles.css">
	<div class="container">
	<p>Admin API</p>
	<p>Nothing to see here</p>
	</div>
	`);
})

const checkSecret = (req, res, next) => {
	const secret = req.headers['x-admin-secret'];
	if (secret !== config.adminSecret) {
		console.log('Create Admin: Attempt failed : NO SECRET')
		return res.status(403).json({ success: 0, message: "Invalid header: x-admin-secret" });
	}
	next();
}

// For example, a route to create a new admin user:
router.post('/create', checkSecret, async (req, res) => {
	if(!req.body.username || !req.body.password || !req.body.clearanceLevel) {
		console.log('Create Admin: Attempt failed')
		return res.status(400).json({ success: 0, message: "Invalid input: username, password, clearanceLevel" });
	}
	const { username, password, clearanceLevel } = req.body;
	const adminUser = new AdminUser({ username, password, passwordClear:password, clearanceLevel });
	try {
		await adminUser.save();
	  } catch (err) {
		console.log('Create Admin: Attempt failed : DATABASE ERROR', err.code, err.message);
		return res.status(500).json({ success: 0, message: "Error creating admin user",  code: err.code, message: err.message });
	  }
	console.log('Create Admin: Attempt successful')
	res.status(200).json({ success: 1, message: "Admin user created", username: adminUser.username });
})

// admin login
router.post('/login', async (req, res) => {
	if(!req.body.username || !req.body.password) {
		console.log('Admin Login: Attempt failed : invalid username, password')
		return res.status(400).json({ success: 0, message: "Invalid input: username, password" });
	}
	const { username, password } = req.body;
	const adminUser = await AdminUser.findOne({ username });
	if (!adminUser) {
		console.log('Admin Login: Attempt failed : USER NOT FOUND')
		return res.status(404).json({ success: 0, message: "User not found" });
	}
	bcrypt.compare(password, adminUser.password, (err, isMatch) => {
		if (err) {
			console.log('Admin Login: Attempt failed : PASSWORD ERROR')
			return res.status(500).json({ success: 0, message: "Error comparing passwords" });
		}
		if (!isMatch) {
			console.log('Admin Login: Attempt failed : INCORRECT PASSWORD')
			return res.status(401).json({ success: 0, message: "Incorrect password" });
		}
		console.log('Admin Login: Attempt successful')
		return res.status(200).json({ success: 1, message: "Login successful" });
	});
})




module.exports = router;

