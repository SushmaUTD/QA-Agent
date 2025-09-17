# JIRA Test Generator with CRUD Application

This project contains two applications:

1. **JIRA Test Generator** (Main Application) - Port 3000
2. **Product CRUD Application** (Separate Application) - Port 3001

## Getting Started

### Running the JIRA Test Generator (Port 3000)
\`\`\`bash
npm run dev
\`\`\`

### Running the CRUD Application (Port 3001)
\`\`\`bash
npm run dev:crud
\`\`\`

### Running Both Applications
You can run both applications simultaneously:

\`\`\`bash
# Terminal 1 - JIRA Test Generator
npm run dev

# Terminal 2 - CRUD Application  
npm run dev:crud
\`\`\`

## Applications Overview

### JIRA Test Generator (localhost:3000)
- Generate comprehensive test cases for projects
- Support for functional, UI, integration, and regression tests
- Test history and analytics
- CSV export functionality

### Product CRUD Application (localhost:3001)
- Full CRUD operations for product management
- REST API endpoints:
  - `GET /api/products` - List all products
  - `POST /api/products` - Create new product
  - `GET /api/products/[id]` - Get specific product
  - `PUT /api/products/[id]` - Update product
  - `DELETE /api/products/[id]` - Delete product
- Product filtering and search
- In-memory data storage (5 sample products included)

## API Endpoints (CRUD Application)

### Products API
- **GET** `/api/products` - Retrieve all products
- **POST** `/api/products` - Create a new product
- **GET** `/api/products/[id]` - Get product by ID
- **PUT** `/api/products/[id]` - Update product by ID
- **DELETE** `/api/products/[id]` - Delete product by ID

### Sample Product Structure
\`\`\`json
{
  "id": "string",
  "name": "string",
  "description": "string", 
  "price": "number",
  "category": "string",
  "status": "active" | "inactive" | "discontinued",
  "stock": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
\`\`\`

## Testing with Playwright

The JIRA Test Generator can be used to create test cases for the CRUD application. Run the test suite with:

\`\`\`bash
npm run test:e2e
\`\`\`

## Features

### CRUD Application Features
- ✅ Create new products
- ✅ Read/List all products with filtering
- ✅ Update existing products
- ✅ Delete products with confirmation
- ✅ Search and filter functionality
- ✅ Product statistics dashboard
- ✅ Responsive design
- ✅ Form validation
- ✅ Toast notifications

### JIRA Test Generator Features
- ✅ Project-based test generation
- ✅ Multiple test types (functional, UI, integration, regression)
- ✅ Test history tracking
- ✅ CSV export
- ✅ Analytics dashboard
- ✅ CRUD-specific test scenarios
