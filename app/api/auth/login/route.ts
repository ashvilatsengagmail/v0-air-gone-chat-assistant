import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory user storage (replace with database in production)
const users = new Map()

// Initialize with admin user
users.set("admin@airgone.com", {
  id: "admin-001",
  name: "AirGone Admin",
  email: "admin@airgone.com",
  password: "admin123",
  farmSize: "large",
  location: "Global",
  primaryCrops: "All Crops",
  role: "admin",
  createdAt: new Date().toISOString(),
})

// Initialize with demo farmer user
users.set("farmer@demo.com", {
  id: "farmer-001",
  name: "Demo Farmer",
  email: "farmer@demo.com",
  password: "farmer123",
  farmSize: "medium",
  location: "Kenya",
  primaryCrops: "Maize, Beans, Tomatoes",
  role: "farmer",
  createdAt: new Date().toISOString(),
})

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Simple validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if user exists (in production, hash and compare passwords)
    const user = users.get(email)
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      message: "Login successful",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
