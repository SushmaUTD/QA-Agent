# Playwright E2E Tests for Product CRUD App

This directory contains end-to-end tests for the Product CRUD application hosted at https://v0-product-crud-app.vercel.app/

## Test Structure

### Core Functionality Tests (`product-crud.spec.ts`)
- **Homepage Loading**: Verifies the application loads without errors
- **Product List Display**: Checks if products are properly displayed
- **Create Product**: Tests the ability to add new products
- **View Product Details**: Verifies product detail viewing functionality
- **Edit Product**: Tests product editing capabilities
- **Delete Product**: Verifies product deletion functionality
- **Form Validation**: Tests client-side form validation
- **Responsive Design**: Ensures mobile compatibility
- **Accessibility**: Basic accessibility compliance checks
- **Error Handling**: Tests graceful handling of network errors

### Performance Tests (`performance.spec.ts`)
- **Load Time**: Measures page load performance
- **Core Web Vitals**: Tests FCP and LCP metrics
- **Memory Leaks**: Checks for memory leak issues

## Running the Tests

### Prerequisites
1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Install Playwright browsers:
   \`\`\`bash
   npx playwright install
   \`\`\`

### Test Execution Commands

#### Run all tests
\`\`\`bash
npm run test
\`\`\`

#### Run tests with UI mode (recommended for development)
\`\`\`bash
npm run test:ui
\`\`\`

#### Run tests in headed mode (see browser)
\`\`\`bash
npm run test:headed
\`\`\`

#### Run tests in debug mode
\`\`\`bash
npm run test:debug
\`\`\`

#### Run specific test file
\`\`\`bash
npx playwright test tests/e2e/product-crud.spec.ts
\`\`\`

#### Run tests on specific browser
\`\`\`bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
\`\`\`

#### Run tests on mobile
\`\`\`bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
\`\`\`

### Test Reports

After running tests, you can view detailed reports:

\`\`\`bash
npx playwright show-report
\`\`\`

Reports include:
- Test results with screenshots on failure
- Video recordings of failed tests
- Trace files for debugging
- Performance metrics

## Test Configuration

The tests are configured to:
- Run against the live application at `https://v0-product-crud-app.vercel.app`
- Test across multiple browsers (Chrome, Firefox, Safari, Edge)
- Include mobile testing (iOS Safari, Android Chrome)
- Capture screenshots and videos on failure
- Generate comprehensive HTML reports

## Troubleshooting

### Common Issues

1. **Tests failing due to slow loading**
   - Increase timeout values in the test configuration
   - Check network connectivity to the live application

2. **Element not found errors**
   - The application UI might have changed
   - Update selectors in the test files to match current UI

3. **Browser installation issues**
   \`\`\`bash
   npx playwright install --with-deps
   \`\`\`

4. **Permission errors on CI/CD**
   - Ensure proper permissions for browser installation
   - Use Docker containers for consistent environments

### Debugging Tips

1. **Use UI Mode** for interactive debugging:
   \`\`\`bash
   npm run test:ui
   \`\`\`

2. **Run single test** to isolate issues:
   \`\`\`bash
   npx playwright test -g "should load the homepage"
   \`\`\`

3. **Enable trace viewer** for failed tests:
   \`\`\`bash
   npx playwright show-trace test-results/[test-name]/trace.zip
   \`\`\`

4. **Use debug mode** to step through tests:
   \`\`\`bash
   npm run test:debug
   \`\`\`

## Continuous Integration

To run these tests in CI/CD:

\`\`\`yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
\`\`\`

## Test Maintenance

- **Regular Updates**: Update selectors when UI changes
- **Performance Baselines**: Adjust performance thresholds as needed
- **Browser Updates**: Keep Playwright browsers updated
- **Test Data**: Ensure test data doesn't interfere with production

## Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Add appropriate assertions and error handling
3. Include both positive and negative test cases
4. Update this README with new test descriptions
