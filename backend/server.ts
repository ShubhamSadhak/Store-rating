/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { readDatabase, writeDatabase, syncDatabase } from "./prisma";
import { User, Store, Rating, UserRole, PlatformStats } from "../frontend/types";
import { JWT_SECRET } from "./utils/jwt";
import { AuthenticatedRequest, authenticateToken, requireRole } from "./middleware/auth";

const app = express();
const PORT = 3000;

// Parse JSON payloads
app.use(express.json());

// Validation Helpers
function isValidName(name: any): boolean {
  return typeof name === "string" && name.trim().length >= 20 && name.trim().length <= 60;
}

function isValidAddress(address: any): boolean {
  return typeof address === "string" && address.trim().length > 0 && address.trim().length <= 400;
}

function isValidPassword(password: any): boolean {
  if (typeof password !== "string") return false;
  if (password.length < 8 || password.length > 16) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  return hasUpper && hasSpecial;
}

function isValidEmail(email: any): boolean {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// ==========================================
// 1. AUTHENTICATION & AUTHORIZATION ENDPOINTS
// ==========================================

// Register Account
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { name, email, password, address, role } = req.body;

  if (!isValidName(name)) {
    res.status(400).json({ error: "Name must be between 20 and 60 characters long" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please enter a valid email address" });
    return;
  }
  if (!isValidPassword(password)) {
    res.status(400).json({ error: "Password must be 8–16 characters long, contain at least one uppercase letter and one special character" });
    return;
  }
  if (!isValidAddress(address)) {
    res.status(400).json({ error: "Address is required and must not exceed 400 characters" });
    return;
  }

  const db = readDatabase();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    res.status(409).json({ error: "Email already registered on the platform" });
    return;
  }

  // Set default role or sanitise requested role. Only ADMIN can add Admins or Owners through general route.
  // Standard user signup defaults to USER.
  let assignedRole = UserRole.USER;
  if (role === UserRole.OWNER) {
    assignedRole = UserRole.OWNER;
  }

  const newUser: User = {
    id: "user-" + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: bcrypt.hashSync(password, 10),
    address: address.trim(),
    role: assignedRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDatabase(db);

  // Exclude password from the response
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ message: "Registration successful", user: userWithoutPassword });
});

// Login User
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const db = readDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    message: "Login successful",
    token,
    user: userWithoutPassword
  });
});

// Change Password Support
app.put("/api/auth/change-password", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }

  if (!isValidPassword(newPassword)) {
    res.status(400).json({ error: "New password must be 8–16 characters, contain at least one uppercase letter and one special character" });
    return;
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex(u => u.id === req.user?.id);

  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = db.users[userIndex];
  if (!user.password || !bcrypt.compareSync(currentPassword, user.password)) {
    res.status(400).json({ error: "Incorrect current password" });
    return;
  }

  db.users[userIndex].password = bcrypt.hashSync(newPassword, 10);
  db.users[userIndex].updatedAt = new Date().toISOString();
  writeDatabase(db);

  res.json({ message: "Password updated successfully" });
});


// ==========================================
// 2. USERS ENDPOINTS (Admin Protected or Self)
// ==========================================

// Get All Users (Admin only)
app.get("/api/users", authenticateToken, requireRole([UserRole.ADMIN]), (req: AuthenticatedRequest, res: Response) => {
  const db = readDatabase();
  
  // Destructure query filters
  const { name, email, address, role, sortBy, sortOrder } = req.query;

  let filteredUsers = db.users.map(({ password, ...u }) => u);

  // Apply sequential filters
  if (name && typeof name === "string") {
    const q = name.toLowerCase();
    filteredUsers = filteredUsers.filter(u => u.name.toLowerCase().includes(q));
  }
  if (email && typeof email === "string") {
    const q = email.toLowerCase();
    filteredUsers = filteredUsers.filter(u => u.email.toLowerCase().includes(q));
  }
  if (address && typeof address === "string") {
    const q = address.toLowerCase();
    filteredUsers = filteredUsers.filter(u => u.address.toLowerCase().includes(q));
  }
  if (role && typeof role === "string") {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }

  // Apply sorting
  if (sortBy && typeof sortBy === "string") {
    const order = sortOrder === "desc" ? -1 : 1;
    filteredUsers.sort((a: any, b: any) => {
      const valA = (a[sortBy] || "").toString().toLowerCase();
      const valB = (b[sortBy] || "").toString().toLowerCase();
      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });
  } else {
    // Default sort by newest
    filteredUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(filteredUsers);
});

// Get User By ID (Admin, or Store Owner viewing reviewer details, or self)
app.get("/api/users/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = readDatabase();
  const userIdToGet = req.params.id;

  const userToGet = db.users.find(u => u.id === userIdToGet);
  if (!userToGet) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const requester = req.user!;
  const hasAccess =
    requester.role === UserRole.ADMIN ||
    requester.id === userIdToGet ||
    // Store owner is allowed to view customer who rated their store
    (requester.role === UserRole.OWNER && db.ratings.some(r => r.userId === userIdToGet && db.stores.some(s => s.id === r.storeId && s.ownerId === requester.id)));

  if (!hasAccess) {
    res.status(403).json({ error: "Access Denied: Unauthorized to view this profile" });
    return;
  }

  const { password: _, ...userWithoutPassword } = userToGet;
  res.json(userWithoutPassword);
});

// Admin adds users (Normal, Owner, or Admin)
app.post("/api/users", authenticateToken, requireRole([UserRole.ADMIN]), (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, address, role } = req.body;

  if (!isValidName(name)) {
    res.status(400).json({ error: "Name must be 20–60 characters" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email syntax" });
    return;
  }
  if (!isValidPassword(password)) {
    res.status(400).json({ error: "Password must be 8–16 characters containing an uppercase and special character" });
    return;
  }
  if (!isValidAddress(address)) {
    res.status(400).json({ error: "Address is required and max 400 characters" });
    return;
  }
  if (!role || !Object.values(UserRole).includes(role as UserRole)) {
    res.status(400).json({ error: "A valid role (ADMIN, OWNER, USER) must be chosen" });
    return;
  }

  const db = readDatabase();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    res.status(409).json({ error: "Email address is already in use" });
    return;
  }

  const newUser: User = {
    id: "user-" + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: bcrypt.hashSync(password, 10),
    address: address.trim(),
    role: role as UserRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDatabase(db);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});


// ==========================================
// 3. STORES ENDPOINTS
// ==========================================

// Browse / Search All Stores
app.get("/api/stores", (req: Request, res: Response) => {
  const db = readDatabase();
  const { search, address, ownerId } = req.query;

  let filteredStores = [...db.stores];

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    filteredStores = filteredStores.filter(s => s.name.toLowerCase().includes(q));
  }

  if (address && typeof address === "string") {
    const q = address.toLowerCase();
    filteredStores = filteredStores.filter(s => s.address.toLowerCase().includes(q));
  }

  if (ownerId && typeof ownerId === "string") {
    filteredStores = filteredStores.filter(s => s.ownerId === ownerId);
  }

  // Attach aggregated statistics (Average Rating and Ratings Count)
  const storesWithStats = filteredStores.map(store => {
    const storeRatings = db.ratings.filter(r => r.storeId === store.id);
    const sum = storeRatings.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = storeRatings.length > 0 ? parseFloat((sum / storeRatings.length).toFixed(1)) : 0;
    
    return {
      ...store,
      averageRating,
      ratingsCount: storeRatings.length
    };
  });

  res.json(storesWithStats);
});

// Get Detailed Store Rating and Customer feedback history
app.get("/api/stores/:id", (req: Request, res: Response) => {
  const db = readDatabase();
  const storeId = req.params.id;

  const store = db.stores.find(s => s.id === storeId);
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  // Get reviews and attach User Info safely (excluding secrets)
  const rawReviews = db.ratings.filter(r => r.storeId === storeId);
  const feedbackHistory = rawReviews.map(r => {
    const rUser = db.users.find(u => u.id === r.userId);
    return {
      id: r.id,
      rating: r.rating,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      userId: r.userId,
      userName: rUser ? rUser.name : "Anonymous Contributor",
      userEmail: rUser ? rUser.email : "",
      userAddress: rUser ? rUser.address : ""
    };
  });

  // Calculate stats
  const sum = rawReviews.reduce((acc, curr) => acc + curr.rating, 0);
  const averageRating = rawReviews.length > 0 ? parseFloat((sum / rawReviews.length).toFixed(1)) : 0;

  res.json({
    ...store,
    averageRating,
    ratingsCount: rawReviews.length,
    feedback: feedbackHistory
  });
});

// Admin Adds Stores
app.post("/api/stores", authenticateToken, requireRole([UserRole.ADMIN]), (req: AuthenticatedRequest, res: Response) => {
  const { name, email, address, ownerId } = req.body;

  if (!name || name.trim().length === 0) {
    res.status(400).json({ error: "Store name is required" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please enter a valid store feedback email" });
    return;
  }
  if (!isValidAddress(address)) {
    res.status(400).json({ error: "Physical address is required and max 400 characters" });
    return;
  }
  if (!ownerId) {
    res.status(400).json({ error: "Providing a designated Store Owner is required" });
    return;
  }

  const db = readDatabase();
  // Ensure the owner exists and has the correct OWNER role
  const assignedOwner = db.users.find(u => u.id === ownerId);
  if (!assignedOwner || assignedOwner.role !== UserRole.OWNER) {
    res.status(400).json({ error: "Target Owner ID must correspond to an active Store Owner account" });
    return;
  }

  const newStore: Store = {
    id: "store-" + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.stores.push(newStore);
  writeDatabase(db);

  res.status(201).json(newStore);
});


// ==========================================
// 4. RATINGS ENDPOINTS
// ==========================================

// Get All Ratings 
app.get("/api/ratings", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = readDatabase();
  const { storeId, userId } = req.query;

  let filteredRatings = [...db.ratings];

  if (storeId && typeof storeId === "string") {
    filteredRatings = filteredRatings.filter(r => r.storeId === storeId);
  }
  if (userId && typeof userId === "string") {
    filteredRatings = filteredRatings.filter(r => r.userId === userId);
  }

  // Hydrate store titles and reviewer credentials for display
  const hydratedRatings = filteredRatings.map(r => {
    const targetStore = db.stores.find(s => s.id === r.storeId);
    const targetUser = db.users.find(u => u.id === r.userId);
    return {
      ...r,
      storeName: targetStore ? targetStore.name : "Unknown Merchant",
      userName: targetUser ? targetUser.name : "Anonymous Contributor"
    };
  });

  res.json(hydratedRatings);
});

// Normal User Submits Rating (1 to 5)
app.post("/api/ratings", authenticateToken, requireRole([UserRole.USER]), (req: AuthenticatedRequest, res: Response) => {
  const { storeId, rating } = req.body;
  const currentUserId = req.user!.id;

  if (!storeId) {
    res.status(400).json({ error: "Store ID is required to score key insights" });
    return;
  }

  const ratingVal = parseInt(rating, 10);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    res.status(400).json({ error: "Rating score must be an integer between 1 and 5 stars" });
    return;
  }

  const db = readDatabase();
  // Ensure the target store exists
  const targetStore = db.stores.find(s => s.id === storeId);
  if (!targetStore) {
    res.status(404).json({ error: "Target store not found" });
    return;
  }

  // Prevent multiple ratings by the same normal user to standardise scores
  const preExisting = db.ratings.find(r => r.userId === currentUserId && r.storeId === storeId);
  if (preExisting) {
    res.status(409).json({
      error: "You have already submitted a rating for this store. Please modify your existing rating instead.",
      existingRatingId: preExisting.id
    });
    return;
  }

  const newRating: Rating = {
    id: "rating-" + Date.now(),
    userId: currentUserId,
    storeId,
    rating: ratingVal,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.ratings.push(newRating);
  writeDatabase(db);

  res.status(201).json(newRating);
});

// Normal User Modifies Rating
app.put("/api/ratings/:id", authenticateToken, requireRole([UserRole.USER]), (req: AuthenticatedRequest, res: Response) => {
  const ratingId = req.params.id;
  const { rating } = req.body;
  const currentUserId = req.user!.id;

  const ratingVal = parseInt(rating, 10);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    res.status(400).json({ error: "Rating score must be an integer between 1 and 5 stars" });
    return;
  }

  const db = readDatabase();
  const ratingIndex = db.ratings.findIndex(r => r.id === ratingId);

  if (ratingIndex === -1) {
    res.status(404).json({ error: "Rating log not found" });
    return;
  }

  const ratingRecord = db.ratings[ratingIndex];

  // Restrict modification strictly to original owners
  if (ratingRecord.userId !== currentUserId) {
    res.status(403).json({ error: "Access Denied: You do not own this rating log" });
    return;
  }

  db.ratings[ratingIndex].rating = ratingVal;
  db.ratings[ratingIndex].updatedAt = new Date().toISOString();
  writeDatabase(db);

  res.json(db.ratings[ratingIndex]);
});


// ==========================================
// 5. GLOBAL METRICS ENDPOINTS
// ==========================================

// Get Admin and Platform Dashboard Statistics
app.get("/api/stats", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = readDatabase();

  // Stats are viewable by Admin, or custom scoped average for Store Owners
  if (req.user?.role === UserRole.ADMIN) {
    const stats: PlatformStats = {
      totalUsers: db.users.length,
      totalStores: db.stores.length,
      totalRatings: db.ratings.length
    };
    res.json(stats);
  } else if (req.user?.role === UserRole.OWNER) {
    // Return store-owner relevant fast analytics
    const myStores = db.stores.filter(s => s.ownerId === req.user?.id);
    const myStoresIds = myStores.map(s => s.id);
    const myRatings = db.ratings.filter(r => myStoresIds.includes(r.storeId));
    const sum = myRatings.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = myRatings.length > 0 ? parseFloat((sum / myRatings.length).toFixed(2)) : 0;

    res.json({
      myStoresCount: myStores.length,
      totalReceivedRatingsCount: myRatings.length,
      averageStoreRating: avg
    });
  } else {
    // Normal User basic state info
    const myRatings = db.ratings.filter(r => r.userId === req.user?.id);
    res.json({
      mySubmittedRatingsCount: myRatings.length
    });
  }
});


// ==========================================
// 6. FRONTEND SINGLE PAGE APP SERVING
// ==========================================

async function startServer() {
  // Sync Neon PostgreSQL database or fallback cleanly to database.json
  try {
    await syncDatabase();
  } catch (err) {
    console.error("Failed to run startup database sync task", err);
  }

  if (process.env.NODE_ENV !== "production") {
    // Run Vite in middlewareMode to support fast reloads in preview mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets compiled inside dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Store Rating Backend] running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Vite Express bootstrapping failed", err);
});
