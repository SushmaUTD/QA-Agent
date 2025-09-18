# Real Browser Automation for JIRA Test Generator

This package provides real browser automation using Puppeteer to test your Goldman Sachs trading instruments application.

## Setup Instructions

1. **Download this automation folder** from your v0 project
2. **Install Node.js** (if not already installed): https://nodejs.org/
3. **Open terminal/command prompt** in the automation folder
4. **Run setup**:
   \`\`\`bash
   npm run setup
   \`\`\`

## Running Tests

### Quick Test
\`\`\`bash
npm test
\`\`\`

### Custom Configuration
Edit `config.json` to modify:
- Application URL
- Test data (symbol, name, price, etc.)
- Browser settings (headless mode, viewport size)

## What It Does

The automation will:
1. 🌐 Open a real Chrome browser
2. 📍 Navigate to your application
3. 👆 Click "Add Instrument" button
4. 📝 Fill out the form with test data
5. ✅ Submit the form
6. 🔍 Verify the instrument appears in the list
7. 📸 Take screenshots of each step

## Results

- **Console output**: Real-time progress and results
- **Screenshots**: Saved in `./screenshots/` folder
- **Success/Failure**: Clear pass/fail status

## Troubleshooting

### Common Issues:
- **Chrome not found**: Install Google Chrome browser
- **Timeout errors**: Increase timeout in config.json
- **Element not found**: Check if your app UI has changed

### Debug Mode:
Set `headless: false` in config.json to watch the browser in action.

## Integration with JIRA Test Generator

This automation can be triggered from your JIRA Test Generator app by:
1. Downloading this package
2. Running it locally
3. Integrating results back into your dashboard

## Next Steps

- Add more test cases
- Integrate with CI/CD pipeline
- Add email reporting
- Connect to real JIRA for ticket updates
\`\`\`

```tsx file="" isHidden
