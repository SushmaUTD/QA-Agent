const puppeteer = require("puppeteer")

class RealBrowserAutomation {
  constructor(config) {
    this.config = config
    this.browser = null
    this.page = null
  }

  async setup() {
    console.log("🚀 Starting real browser automation...")
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1920, height: 1080 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    this.page = await this.browser.newPage()
  }

  async testAddInstrument(testData) {
    const results = {
      success: false,
      steps: [],
      errors: [],
      screenshots: [],
      executionTime: Date.now(),
    }

    try {
      // Step 1: Navigate to application
      console.log("📍 Step 1: Navigating to application...")
      await this.page.goto(this.config.applicationUrl, { waitUntil: "networkidle2" })
      results.steps.push({ step: 1, action: "Navigate to application", status: "PASSED", time: Date.now() })

      // Take screenshot
      await this.page.screenshot({ path: "screenshots/step1-homepage.png" })
      results.screenshots.push("step1-homepage.png")

      // Step 2: Wait for page to load and find Add Instrument button
      console.log("🔍 Step 2: Looking for Add Instrument button...")
      await this.page.waitForSelector('button:has-text("Add Instrument")', { timeout: 10000 })
      results.steps.push({ step: 2, action: "Locate Add Instrument button", status: "PASSED", time: Date.now() })

      // Step 3: Click Add Instrument button
      console.log("👆 Step 3: Clicking Add Instrument button...")
      await this.page.click('button:has-text("Add Instrument")')
      await this.page.waitForTimeout(1000) // Wait for modal/form to appear
      results.steps.push({ step: 3, action: "Click Add Instrument button", status: "PASSED", time: Date.now() })

      // Take screenshot of form
      await this.page.screenshot({ path: "screenshots/step3-form-opened.png" })
      results.screenshots.push("step3-form-opened.png")

      // Step 4: Fill out the form
      console.log("📝 Step 4: Filling out instrument form...")

      // Fill Symbol field
      await this.page.fill('input[name="symbol"], input[placeholder*="symbol" i]', testData.symbol)
      await this.page.waitForTimeout(500)

      // Fill Name field
      await this.page.fill('input[name="name"], input[placeholder*="name" i]', testData.name)
      await this.page.waitForTimeout(500)

      // Fill Price field
      await this.page.fill('input[name="price"], input[placeholder*="price" i]', testData.price.toString())
      await this.page.waitForTimeout(500)

      // Select Asset Class if dropdown exists
      if (testData.assetClass) {
        try {
          await this.page.selectOption('select[name="assetClass"], select[name="asset_class"]', testData.assetClass)
        } catch (e) {
          console.log("Asset class dropdown not found, skipping...")
        }
      }

      results.steps.push({ step: 4, action: "Fill form fields", status: "PASSED", time: Date.now() })

      // Take screenshot of filled form
      await this.page.screenshot({ path: "screenshots/step4-form-filled.png" })
      results.screenshots.push("step4-form-filled.png")

      // Step 5: Submit the form
      console.log("✅ Step 5: Submitting form...")
      await this.page.click(
        'button[type="submit"], button:has-text("Add"), button:has-text("Save"), button:has-text("Create")',
      )
      await this.page.waitForTimeout(2000) // Wait for submission
      results.steps.push({ step: 5, action: "Submit form", status: "PASSED", time: Date.now() })

      // Step 6: Verify the instrument appears in the list
      console.log("🔍 Step 6: Verifying instrument appears in list...")
      await this.page.waitForTimeout(1000)

      // Look for the new instrument in the table
      const instrumentExists = (await this.page.locator(`text=${testData.symbol}`).count()) > 0

      if (instrumentExists) {
        results.steps.push({ step: 6, action: "Verify instrument in list", status: "PASSED", time: Date.now() })
        console.log("✅ SUCCESS: Instrument successfully added and visible in list!")
      } else {
        results.steps.push({ step: 6, action: "Verify instrument in list", status: "FAILED", time: Date.now() })
        results.errors.push("Instrument not found in list after submission")
      }

      // Take final screenshot
      await this.page.screenshot({ path: "screenshots/step6-final-result.png" })
      results.screenshots.push("step6-final-result.png")

      results.success = results.errors.length === 0
      results.executionTime = Date.now() - results.executionTime
    } catch (error) {
      console.error("❌ Test failed:", error.message)
      results.errors.push(error.message)
      results.success = false

      // Take error screenshot
      await this.page.screenshot({ path: "screenshots/error-screenshot.png" })
      results.screenshots.push("error-screenshot.png")
    }

    return results
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }
}

// Main execution
async function runTest() {
  const config = {
    applicationUrl: "https://v0-product-crud-app.vercel.app/",
  }

  const testData = {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 420.5,
    assetClass: "Stock",
  }

  const automation = new RealBrowserAutomation(config)

  try {
    await automation.setup()
    const results = await automation.testAddInstrument(testData)

    console.log("\n📊 TEST RESULTS:")
    console.log("================")
    console.log(`Success: ${results.success}`)
    console.log(`Execution Time: ${results.executionTime}ms`)
    console.log(`Steps Completed: ${results.steps.length}`)
    console.log(`Errors: ${results.errors.length}`)
    console.log(`Screenshots: ${results.screenshots.length}`)

    if (results.errors.length > 0) {
      console.log("\n❌ ERRORS:")
      results.errors.forEach((error) => console.log(`- ${error}`))
    }

    console.log("\n📸 Screenshots saved in ./screenshots/ directory")
  } finally {
    await automation.cleanup()
  }
}

// Run if called directly
if (require.main === module) {
  runTest().catch(console.error)
}

module.exports = { RealBrowserAutomation }
