import { type NextRequest, NextResponse } from "next/server"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  inStock: boolean
  createdAt: string
}

// In-memory storage for demo purposes
const products: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 199.99,
    category: "Electronics",
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Smart Watch",
    description: "Fitness tracking smartwatch with heart rate monitor",
    price: 299.99,
    category: "Electronics",
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Coffee Maker",
    description: "Programmable coffee maker with thermal carafe",
    price: 89.99,
    category: "Appliances",
    inStock: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Desk Lamp",
    description: "LED desk lamp with adjustable brightness",
    price: 45.99,
    category: "Furniture",
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker with excellent sound quality",
    price: 79.99,
    category: "Electronics",
    inStock: true,
    createdAt: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id)

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, price, category, inStock } = body

    const productIndex = products.findIndex((p) => p.id === params.id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    products[productIndex] = {
      ...products[productIndex],
      name,
      description: description || "",
      price: Number(price),
      category: category || "",
      inStock: inStock !== undefined ? inStock : true,
    }

    return NextResponse.json(products[productIndex])
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const productIndex = products.findIndex((p) => p.id === params.id)

  if (productIndex === -1) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  products.splice(productIndex, 1)
  return NextResponse.json({ message: "Product deleted successfully" })
}
