import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo purposes
const products = [
  {
    id: "1",
    name: "Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 199.99,
    category: "Electronics",
    status: "active" as const,
    stock: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Smart Watch",
    description: "Fitness tracking smartwatch with heart rate monitor",
    price: 299.99,
    category: "Electronics",
    status: "active" as const,
    stock: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Coffee Maker",
    description: "Programmable coffee maker with thermal carafe",
    price: 89.99,
    category: "Appliances",
    status: "active" as const,
    stock: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Desk Lamp",
    description: "LED desk lamp with adjustable brightness",
    price: 45.99,
    category: "Furniture",
    status: "inactive" as const,
    stock: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker with waterproof design",
    price: 79.99,
    category: "Electronics",
    status: "active" as const,
    stock: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function GET() {
  return NextResponse.json({
    success: true,
    products,
    total: products.length,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newProduct = {
      id: (products.length + 1).toString(),
      name: body.name,
      description: body.description || "",
      price: Number.parseFloat(body.price) || 0,
      category: body.category || "",
      status: body.status || "active",
      stock: Number.parseInt(body.stock) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    products.push(newProduct)

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: "Product created successfully",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 400 })
  }
}
