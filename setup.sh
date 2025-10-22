#!/bin/bash

echo "Setting up MSME ONE Chatbot..."
echo

echo "Installing Python dependencies..."
pip install Flask==2.3.3 Flask-CORS==4.0.0 PyPDF2==3.0.1 requests==2.31.0 Werkzeug==2.3.7

echo
echo "Installing Node.js dependencies..."
npm install

echo
echo "Building React frontend..."
npm run build

echo
echo "Setup complete!"
echo
echo "To run the application:"
echo "1. Make sure to add your Hugging Face API token to app.py (line 25)"
echo "2. Run: python app.py"
echo "3. Open your browser and go to: http://localhost:5000"
echo
