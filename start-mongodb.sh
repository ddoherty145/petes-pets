#!/bin/bash

# MongoDB Management Script

echo "🔍 Checking MongoDB status..."

# Check if MongoDB is running
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is already running"
else
    echo "🚀 Starting MongoDB..."
    
    # Create data directory if it doesn't exist
    mkdir -p /usr/local/var/mongodb
    
    # Start MongoDB
    mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb.log --fork
    
    # Wait a moment for MongoDB to start
    sleep 3
    
    # Check if it started successfully
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB started successfully"
    else
        echo "❌ Failed to start MongoDB"
        echo "💡 Try running: brew services start mongodb-community"
        exit 1
    fi
fi

echo "🎯 MongoDB is ready!"
