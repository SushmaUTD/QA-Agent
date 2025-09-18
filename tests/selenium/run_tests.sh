#!/bin/bash

echo "🚀 Setting up Selenium Test Environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "📋 Available test commands:"
echo "1. Run all tests: pytest product_crud_test.py -v"
echo "2. Run tests in headless mode: pytest product_crud_test.py -v --headless"
echo "3. Run with HTML report: pytest product_crud_test.py -v --html=test_report.html --self-contained-html"
echo "4. Run specific test: pytest product_crud_test.py::TestProductCRUD::test_01_homepage_loads_successfully -v"

echo ""
echo "🧪 Running all tests against https://v0-product-crud-app.vercel.app/"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

# Run all tests with verbose output
pytest product_crud_test.py -v --tb=short

echo ""
echo "✅ Test execution completed!"
echo "📊 To generate HTML report, run: pytest product_crud_test.py -v --html=test_report.html --self-contained-html"
