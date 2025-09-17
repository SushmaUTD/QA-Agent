import { type NextRequest, NextResponse } from "next/server"

// In-memory storage (same as in route.ts)
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id)

  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    product,
  })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const productIndex = products.findIndex((p) => p.id === params.id)

    if (productIndex === -1) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    const updatedProduct = {
      ...products[productIndex],
      name: body.name || products[productIndex].name,
      description: body.description || products[productIndex].description,
      price: Number.parseFloat(body.price) || products[productIndex].price,
      category: body.category || products[productIndex].category,
      status: body.status || products[productIndex].status,
      stock: Number.parseInt(body.stock) || products[productIndex].stock,
      updatedAt: new Date().toISOString(),
    }

    products[productIndex] = updatedProduct

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: "Product updated successfully",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const productIndex = products.findIndex((p) => p.id === params.id)

  if (productIndex === -1) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
  }

  const deletedProduct = products[productIndex]
  products.splice(productIndex, 1)

  return NextResponse.json({
    success: true,
    product: deletedProduct,
    message: "Product deleted successfully",
  })
}
