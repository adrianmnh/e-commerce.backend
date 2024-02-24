# Use the node:21-alpine image as the base image
FROM node:21-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the code to the working directory
COPY . .

# Expose port 443
EXPOSE 443

# Start the application
CMD [ "node", "index.js" ]