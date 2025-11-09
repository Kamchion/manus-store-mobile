import { Router } from "express";
import { SignJWT } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Dev-only login endpoint
router.post("/dev-login", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Find user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult[0];

    // Create JWT token with the format expected by SDK
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "dev-secret-change-in-production"
    );

    const token = await new SignJWT({
      openId: user.id,
      appId: process.env.VITE_APP_ID || "b2b_store_001",
      name: user.name || "",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // Set cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
      },
    });
  } catch (error) {
    console.error("Dev login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Dev-only: Get all users for selection
router.get("/dev-users", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      companyName: users.companyName,
    }).from(users);

    return res.json(allUsers);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ error: "Failed to get users" });
  }
});

export default router;

