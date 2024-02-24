const dotenv = require("dotenv"); // Dotenv for loading environment variables from a .env file into process.env

dotenv.config(); // Loading environment variables from a .env file into process.env

const config = {
	development: {
		port: process.env.PORT || 4000, // Default port for local development
		dbUsername: process.env.DB_USERNAME,
		dbPassword: process.env.DB_PASSWORD,
		dbDelete: process.env.DB_DELETE,
		homepage: process.env.HOMEPAGE,
	},

	production: {
		port: process.env.PORT || 443, // Default HTTPS port for production
		dbUsername: process.env.DB_USERNAME,
		dbPassword: process.env.DB_PASSWORD,
		dbDelete: process.env.DB_DELETE,
		homepage: process.env.HOMEPAGE
		// Add more production-specific configurations if needed
	}
};

module.exports = process.env.NODE_ENV === 'production' ? config.production : config.development;
