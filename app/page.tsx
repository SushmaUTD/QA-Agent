export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">JIRA Test AI - Product CRUD Application</h1>
      <p className="text-gray-600 mb-6">Generate test cases for your product management application</p>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Available JIRA Tickets</h2>

        <div className="space-y-4">
          <div className="border p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-600">PROD-101</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">High</span>
            </div>
            <h3 className="font-semibold mb-2">Add New Product Instrument</h3>
            <p className="text-gray-600 text-sm mb-3">
              Implement functionality to add new product instruments with form validation and real-time display in the
              products table
            </p>
            <div className="text-sm text-gray-500">
              <p>
                <strong>Status:</strong> QA
              </p>
              <p>
                <strong>Assignee:</strong> developer@company.com
              </p>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Acceptance Criteria:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• User can click 'Add Product' button to open the product form</li>
                <li>• Form validates required fields (Name, Price, Category, Description)</li>
                <li>• New product appears immediately in the products table below</li>
                <li>• Form resets after successful submission</li>
                <li>• Success message displays after adding product</li>
              </ul>
            </div>
          </div>

          <div className="border p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-600">PROD-102</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">High</span>
            </div>
            <h3 className="font-semibold mb-2">Verify Product Display in Table via GET API</h3>
            <p className="text-gray-600 text-sm mb-3">
              Ensure that newly added products are properly fetched via GET API and displayed in the products table with
              correct data formatting
            </p>
            <div className="text-sm text-gray-500">
              <p>
                <strong>Status:</strong> QA
              </p>
              <p>
                <strong>Assignee:</strong> qa.engineer@company.com
              </p>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Acceptance Criteria:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• GET /api/products endpoint returns all products correctly</li>
                <li>• Added product appears in the table with all field data</li>
                <li>• Table columns display: Name, Price, Category, Description, Actions</li>
                <li>• Price displays with proper currency formatting</li>
                <li>• Actions column shows Edit and Delete buttons</li>
              </ul>
            </div>
          </div>

          <div className="border p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-600">PROD-103</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">High</span>
            </div>
            <h3 className="font-semibold mb-2">Product CRUD Operations Integration</h3>
            <p className="text-gray-600 text-sm mb-3">
              Implement complete Create, Read, Update, Delete operations for product management
            </p>
            <div className="text-sm text-gray-500">
              <p>
                <strong>Status:</strong> Ready for QA
              </p>
              <p>
                <strong>Assignee:</strong> backend.dev@company.com
              </p>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Acceptance Criteria:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• POST /api/products creates new products successfully</li>
                <li>• GET /api/products retrieves all products</li>
                <li>• PUT /api/products/:id updates existing products</li>
                <li>• DELETE /api/products/:id removes products</li>
                <li>• All operations reflect immediately in the UI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800 font-medium">✓ JIRA tickets updated for your Product CRUD application</p>
        <p className="text-blue-600 text-sm mt-1">
          These tickets are specifically designed for testing the application at https://v0-product-crud-app.vercel.app/
        </p>
      </div>
    </div>
  )
}
