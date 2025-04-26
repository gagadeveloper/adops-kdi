#!/bin/bash
echo "Cleaning up build artifacts..."
rm -rf .next

echo "Cleaning node_modules..."
rm -rf node_modules

echo "Installing dependencies..."
npm install

echo "Building the application..."
npm run build

echo "Starting the application..."
npm start