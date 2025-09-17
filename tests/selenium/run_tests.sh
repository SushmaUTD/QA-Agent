#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run all tests with verbose output
echo "Running Selenium tests for Add Instrument functionality..."
pytest add_instrument_test.py -v --tb=short

# Run specific test
# pytest add_instrument_test.py::TestAddInstrument::test_add_equity_instrument_success -v

# Run tests with HTML report
# pytest add_instrument_test.py --html=test_report.html --self-contained-html

echo "Tests completed!"
