#!/bin/bash

echo "=== KingBlox Deploy Script ==="

# 1. Pull latest code
echo "[1/6] Pulling latest code..."
git pull origin main

# 2. Clean up
echo "[2/6] Cleaning up..."
rm -rf .next
rm -rf node_modules/.cache

# 3. Install dependencies
echo "[3/6] Installing dependencies..."
npm install

# 4. Build
echo "[4/6] Building..."
npm run build

# 5. Stop PM2
echo "[5/6] Stopping PM2..."
pm2 delete all

# 6. Start with PM2
echo "[6/6] Starting with PM2..."
pm2 start ecosystem.config.js --update-env

echo "=== Deploy Complete ==="
pm2 list
