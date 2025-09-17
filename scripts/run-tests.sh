#!/bin/bash

echo "🚀 Running Playwright E2E Tests for Project Management CRUD Application"

# Install dependencies if needed
if [ ! -d "node_modules/@playwright" ]; then
    echo "📦 Installing Playwright..."
    npm install @playwright/test
    npx playwright install
fi

# Start the development server in background
echo "🔧 Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 10

# Run the tests
echo "🧪 Running E2E tests..."
npm run test:e2e

# Capture test results
TEST_EXIT_CODE=$?

# Clean up - kill the dev server
echo "🧹 Cleaning up..."
kill $DEV_PID

# Exit with test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed!"
fi

exit $TEST_EXIT_CODE
