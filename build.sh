#!/bin/bash

set -e

echo "🔨 Building n8n-nodes-safepal..."

# Clean previous build
echo "📦 Cleaning previous build..."
rm -rf dist/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Run TypeScript compiler
echo "🔧 Compiling TypeScript..."
npx tsc

# Copy non-TypeScript files
echo "📋 Copying assets..."
mkdir -p dist/nodes/SafePal
cp nodes/SafePal/safepal.svg dist/nodes/SafePal/ 2>/dev/null || true

# Verify build
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📁 Build output:"
    find dist -type f -name "*.js" | head -20
    echo ""
    echo "📊 Total files: $(find dist -type f | wc -l)"
else
    echo "❌ Build failed!"
    exit 1
fi
