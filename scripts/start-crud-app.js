#!/usr/bin/env node

const { spawn } = require("child_process")
const path = require("path")

console.log("🚀 Starting CRUD Application on port 3001...")
console.log("📝 This is a separate product management application")
console.log("🔗 Access it at: http://localhost:3001")
console.log("")

// Start the Next.js development server on port 3001
const nextProcess = spawn("npx", ["next", "dev", "-p", "3001"], {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: true,
})

nextProcess.on("close", (code) => {
  console.log(`CRUD application process exited with code ${code}`)
})

nextProcess.on("error", (error) => {
  console.error("Failed to start CRUD application:", error)
})

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down CRUD application...")
  nextProcess.kill("SIGINT")
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down CRUD application...")
  nextProcess.kill("SIGTERM")
  process.exit(0)
})
