# Use the official Node.js lightweight image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the backend source code
COPY . .

# Expose the port your Express app runs on (matching process.env.PORT || 4000)
EXPOSE 4000

# Start the application
CMD [ "npm", "start" ]
