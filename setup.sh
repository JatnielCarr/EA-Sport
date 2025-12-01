#!/bin/bash

# Esports Tournament API - Setup Script
echo "🚀 Setting up Esports Tournament API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database credentials"
else
    echo "📝 .env file already exists"
fi

# Setup database
echo "🗄️  Setting up database..."
echo "⚠️  Make sure PostgreSQL is running and you have created the database"
echo "   Run: createdb esports_tournament_db"
echo ""
echo "🔄 Run the following commands manually:"
echo "   npm run prisma:generate"
echo "   npm run prisma:migrate"
echo "   npm run prisma:seed  # Optional: populate with sample data"
echo ""

echo "🎉 Setup completed!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "📚 API Documentation will be available at:"
echo "   http://localhost:3000/documentation"