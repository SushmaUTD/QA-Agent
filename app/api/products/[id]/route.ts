import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for products (shared with main route)
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

// GET - Retrieve a specific product by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = products.find((p) => p.id === params.id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PUT - Update a specific product by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const productIndex = products.findIndex((p) => p.id === params.id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Validate required fields
    const { name, description, price, category, inStock } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    // Update product
    const updatedProduct = {
      ...products[productIndex],
      name,
      description: description || "",
      price: Number.parseFloat(price),
      category: category || "",
      inStock: inStock !== undefined ? inStock : true,
    }

    products[productIndex] = updatedProduct

    return NextResponse.json(updatedProduct)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE - Delete a specific product by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productIndex = products.findIndex((p) => p.id === params.id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const deletedProduct = products[productIndex]
    products.splice(productIndex, 1)

    return NextResponse.json(deletedProduct)
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
