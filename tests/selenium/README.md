# Selenium Test Suite for Product CRUD Application

This directory contains Selenium-based end-to-end tests for the Product CRUD application hosted at **https://v0-product-crud-app.vercel.app/**

## Test Coverage

### Core Functionality Tests (`product_crud_test.py`)
1. **Homepage Loading** - Verifies the application loads without errors
2. **Product List Display** - Checks if products are properly displayed  
3. **Add New Product** - Tests the ability to create new products
4. **Form Validation** - Tests client-side form validation
5. **Responsive Design** - Ensures mobile/tablet compatibility
6. **Performance Check** - Basic performance and load time testing

## Prerequisites

### System Requirements
- Python 3.7 or higher
- Chrome browser installed
- Internet connection (tests run against live application)

### Python Dependencies
All dependencies are listed in `requirements.txt`:
- `selenium==4.26.1` - WebDriver automation
- `pytest==8.3.3` - Test framework
- `webdriver-manager==4.0.2` - Automatic ChromeDriver management
- `pytest-html==4.1.1` - HTML test reports
- `pytest-xvfb==3.0.0` - Virtual display for headless environments

## Quick Start

### 1. Setup Environment
\`\`\`bash
cd tests/selenium

# Make the setup script executable
chmod +x run_tests.sh

# Run the setup and tests
./run_tests.sh
\`\`\`

### 2. Manual Setup (Alternative)
\`\`\`bash
cd tests/selenium

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
\`\`\`

## Running Tests

### Basic Test Execution
\`\`\`bash
# Run all tests
pytest product_crud_test.py -v

# Run specific test
pytest product_crud_test.py::TestProductCRUD::test_01_homepage_loads_successfully -v

# Run tests in headless mode (no browser window)
pytest product_crud_test.py -v --headless
\`\`\`

### Advanced Options
\`\`\`bash
# Generate HTML report
pytest product_crud_test.py -v --html=test_report.html --self-contained-html

# Run with detailed output
pytest product_crud_test.py -v --tb=long

# Run tests and stop on first failure
pytest product_crud_test.py -v -x

# Run tests in parallel (if pytest-xdist installed)
pytest product_crud_test.py -v -n 2
\`\`\`

### Using npm Scripts (from project root)
\`\`\`bash
# Run Selenium tests
npm run test:selenium

# Run in headless mode  
npm run test:selenium:headless

# Generate HTML report
npm run test:selenium:report
\`\`\`

## Test Configuration

### Browser Options
The tests are configured with the following Chrome options for stability:
- `--no-sandbox` - Bypass OS security model
- `--disable-dev-shm-usage` - Overcome limited resource problems
- `--disable-gpu` - Disable GPU acceleration
- `--window-size=1920,1080` - Set consistent window size

### Timeouts
- **Element Wait**: 15 seconds (configurable in WebDriverWait)
- **Page Load**: 30 seconds (Selenium default)
- **Implicit Wait**: Not used (explicit waits preferred)

## Test Results

### Console Output
Tests provide detailed console output including:
- Test progress and status
- Element discovery information
- Performance metrics
- Error details and screenshots paths

### HTML Reports
Generate comprehensive HTML reports with:
\`\`\`bash
pytest product_crud_test.py --html=test_report.html --self-contained-html
\`\`\`

Reports include:
- Test results summary
- Individual test details
- Screenshots on failure
- Browser logs
- Execution timeline

## Troubleshooting

### Common Issues

1. **ChromeDriver Issues**
   \`\`\`bash
   # Clear ChromeDriver cache
   rm -rf ~/.wdm
   
   # Reinstall dependencies
   pip install --upgrade selenium webdriver-manager
   \`\`\`

2. **Element Not Found Errors**
   - The application UI may have changed
   - Check if the live application is accessible
   - Update selectors in test files if needed

3. **Timeout Errors**
   \`\`\`bash
   # Increase timeout in conftest.py or test files
   # Check network connectivity to live application
   \`\`\`

4. **Permission Errors**
   \`\`\`bash
   # On Linux/Mac, ensure script is executable
   chmod +x run_tests.sh
   
   # On Windows, run as administrator if needed
   \`\`\`

### Debug Mode
Run individual tests with debug information:
\`\`\`bash
# Run single test with maximum verbosity
pytest product_crud_test.py::TestProductCRUD::test_01_homepage_loads_successfully -v -s --tb=long

# Run with browser visible (not headless)
pytest product_crud_test.py -v
\`\`\`

### Headless Environment Setup
For CI/CD or headless servers:
\`\`\`bash
# Install virtual display
sudo apt-get install xvfb

# Run with virtual display
xvfb-run -a pytest product_crud_test.py -v --headless
\`\`\`

## Continuous Integration

### GitHub Actions Example
\`\`\`yaml
name: Selenium Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        cd tests/selenium
        pip install -r requirements.txt
    
    - name: Run Selenium tests
      run: |
        cd tests/selenium
        pytest product_crud_test.py -v --headless --html=test_report.html --self-contained-html
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: selenium-test-results
        path: tests/selenium/test_report.html
\`\`\`

## Test Maintenance

### Regular Updates
- **Dependencies**: Update `requirements.txt` monthly
- **Selectors**: Update element selectors when UI changes
- **Test Data**: Ensure test data doesn't conflict with production

### Adding New Tests
1. Add new test methods to `TestProductCRUD` class
2. Follow naming convention: `test_##_descriptive_name`
3. Include proper assertions and error handling
4. Update this README with new test descriptions

## Application-Specific Notes

### Target Application
- **URL**: https://v0-product-crud-app.vercel.app/
- **Type**: Product CRUD (Create, Read, Update, Delete) application
- **Framework**: Likely React/Next.js based on Vercel hosting

### Expected Features
The tests are designed to work with common CRUD application patterns:
- Product listing/grid view
- Add/Create product forms
- Edit/Update functionality
- Delete operations
- Form validation
- Responsive design

### Adaptive Selectors
Tests use multiple selector strategies to handle different UI implementations:
- Data attributes (`data-testid`)
- CSS classes (`.product-item`, `.form`)
- Element types (`button`, `input`, `form`)
- Text content matching
- ARIA attributes

This approach makes tests more resilient to minor UI changes.
