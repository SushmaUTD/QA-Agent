import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for products (in a real app, this would be a database)
const products = [
  {
    id: "1",
    name: "Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 199.99,
    category: "Electronics",
    inStock: true,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Smart Watch",
    description: "Fitness tracking smartwatch with heart rate monitor",
    price: 299.99,
    category: "Electronics",
    inStock: true,
    createdAt: "2024-01-16T11:00:00Z",
  },
  {
    id: "3",
    name: "Coffee Maker",
    description: "Programmable coffee maker with thermal carafe",
    price: 89.99,
    category: "Appliances",
    inStock: true,
    createdAt: "2024-01-17T09:00:00Z",
  },
  {
    id: "4",
    name: "Desk Lamp",
    description: "LED desk lamp with adjustable brightness",
    price: 45.99,
    category: "Furniture",
    inStock: false,
    createdAt: "2024-01-18T14:00:00Z",
  },
  {
    id: "5",
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker with waterproof design",
    price: 79.99,
    category: "Electronics",
    inStock: true,
    createdAt: "2024-01-19T16:00:00Z",
  },
]

// GET - Retrieve all products
export async function GET() {
  try {
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { name, description, price, category, inStock } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    // Create new product
    const newProduct = {
      id: Date.now().toString(),
      name,
      description: description || "",
      price: Number.parseFloat(price),
      category: category || "",
      inStock: inStock !== undefined ? inStock : true,
      createdAt: new Date().toISOString(),
    }

    products.push(newProduct)

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
