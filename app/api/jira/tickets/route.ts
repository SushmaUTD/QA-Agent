import { type NextRequest, NextResponse } from "next/server"

interface JiraConfig {
  url: string
  email: string
  apiToken: string
  projectKey: string
}

interface JiraTicket {
  id: string
  key: string
  summary: string
  description: string
  status: string
  priority: string
  acceptanceCriteria: string[]
}

export async function POST(request: NextRequest) {
  try {
    const jiraConfig: JiraConfig = await request.json()

    const mockTickets: JiraTicket[] = [
      {
        id: "1",
        key: `${jiraConfig.projectKey}-101`,
        summary: "User Authentication API",
        description: "Implement user login and registration endpoints",
        status: "In Progress",
        priority: "High",
        acceptanceCriteria: [
          "POST /api/auth/login should accept email and password",
          "POST /api/auth/register should create new user account",
          "API should return JWT token on successful authentication",
          "Invalid credentials should return 401 status code",
          'Sample payload: {"email": "user@example.com", "password": "password123"}',
        ],
      },
      {
        id: "2",
        key: `${jiraConfig.projectKey}-102`,
        summary: "Product Catalog API",
        description: "Create endpoints for product management",
        status: "To Do",
        priority: "Medium",
        acceptanceCriteria: [
          "GET /api/products should return list of all products",
          "GET /api/products/{id} should return specific product details",
          "POST /api/products should create new product (admin only)",
          "PUT /api/products/{id} should update existing product",
          'Sample response: {"id": 1, "name": "Product Name", "price": 99.99, "category": "electronics"}',
        ],
      },
      {
        id: "3",
        key: `${jiraConfig.projectKey}-103`,
        summary: "Order Processing System",
        description: "Handle customer order creation and tracking",
        status: "Done",
        priority: "High",
        acceptanceCriteria: [
          "POST /api/orders should create new order with items",
          "GET /api/orders/{id} should return order details and status",
          "PUT /api/orders/{id}/status should update order status",
          "API should validate inventory before order creation",
          'Sample payload: {"customerId": 123, "items": [{"productId": 1, "quantity": 2}], "totalAmount": 199.98}',
        ],
      },
    ]

    return NextResponse.json({
      success: true,
      tickets: mockTickets,
    })
  } catch (error) {
    console.error("JIRA API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tickets from JIRA",
      },
      { status: 500 },
    )
  }
}
