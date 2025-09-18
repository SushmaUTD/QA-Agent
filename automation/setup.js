const fs = require("fs")
const path = require("path")

console.log("🔧 Setting up automation environment...")

// Create screenshots directory
const screenshotsDir = path.join(__dirname, "screenshots")
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir)
  console.log("✅ Created screenshots directory")
}

// Create config file
const configPath = path.join(__dirname, "config.json")
const defaultConfig = {
  applicationUrl: "https://v0-product-crud-app.vercel.app/",
  browser: {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    timeout: 30000,
  },
  testData: {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 420.5,
    assetClass: "Stock",
  },
}

fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
console.log("✅ Created config.json")

console.log('\n🚀 Setup complete! Run "npm test" to execute the automation.')
