import { test, expect } from "@playwright/test"

test.describe("Performance Tests", () => {
  test("should load within acceptable time limits", async ({ page }) => {
    const startTime = Date.now()

    await page.goto("/")
    await page.waitForLoadState("networkidle")

    const loadTime = Date.now() - startTime

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)

    console.log(`Page loaded in ${loadTime}ms`)
  })

  test("should have good Core Web Vitals", async ({ page }) => {
    await page.goto("/")

    // Wait for page to fully load
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals: Record<string, number> = {}

          entries.forEach((entry) => {
            if (entry.name === "first-contentful-paint") {
              vitals.FCP = entry.startTime
            }
            if (entry.name === "largest-contentful-paint") {
              vitals.LCP = entry.startTime
            }
          })

          resolve(vitals)
        }).observe({ entryTypes: ["paint", "largest-contentful-paint"] })

        // Fallback timeout
        setTimeout(() => resolve({}), 3000)
      })
    })

    console.log("Performance metrics:", metrics)

    // Basic performance assertions
    if (metrics && typeof metrics === "object") {
      const metricsObj = metrics as Record<string, number>

      // First Contentful Paint should be under 2 seconds
      if (metricsObj.FCP) {
        expect(metricsObj.FCP).toBeLessThan(2000)
      }

      // Largest Contentful Paint should be under 2.5 seconds
      if (metricsObj.LCP) {
        expect(metricsObj.LCP).toBeLessThan(2500)
      }
    }
  })

  test("should not have memory leaks", async ({ page }) => {
    await page.goto("/")

    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          }
        : null
    })

    // Perform some interactions
    const buttons = page.locator("button")
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        await button.click()
        await page.waitForTimeout(500)
      }
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        ;(window as any).gc()
      }
    })

    // Get final memory usage
    const finalMetrics = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          }
        : null
    })

    if (initialMetrics && finalMetrics) {
      const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize
      console.log(`Memory increase: ${memoryIncrease} bytes`)

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    }
  })
})
