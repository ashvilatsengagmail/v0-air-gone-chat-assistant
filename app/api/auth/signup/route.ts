import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory user storage (replace with database in production)
const users = new Map()

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, farmSize, location, primaryCrops } = await req.json()

    // Simple validation
    if (!name || !email || !password || !location || !farmSize || !primaryCrops) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    if (users.has(email)) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 409 })
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, hash this password
      farmSize,
      location,
      primaryCrops,
      createdAt: new Date().toISOString(),
    }

    users.set(email, newUser)

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json({
      user: userWithoutPassword,
      message: "Account created successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
