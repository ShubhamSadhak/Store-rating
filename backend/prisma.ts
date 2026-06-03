/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";
import { User, Store, Rating, UserRole } from "../frontend/types";
import { PrismaClient } from "@prisma/client";

const DB_FILE = path.join(process.cwd(), "database.json");

export interface DBStructure {
  users: User[];
  stores: Store[];
  ratings: Rating[];
}

// Seed helper to hash passwords synchronistically on startup
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

const DEFAULT_DB: DBStructure = {
  users: [
    {
      id: "admin-1",
      name: "Platform Administrator Main Account", // 36 characters (fits 20-60 rules)
      email: "admin@platform.com",
      password: hashPassword("AdminP@ss123!"), // 8-16 characters, uppercase, special char
      address: "100 Admin Plaza Boulevard, Suite 500, Tech City CA 94016",
      role: UserRole.ADMIN,
      createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
    },
    {
      id: "owner-1",
      name: "Fresh Market Store Owner Representative", // 40 characters
      email: "owner1@stores.com",
      password: hashPassword("OwnerP@ss123!"),
      address: "234 Organic Avenue, Farmville VT 05401",
      role: UserRole.OWNER,
      createdAt: new Date("2026-01-10T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-10T00:00:00.000Z").toISOString()
    },
    {
      id: "owner-2",
      name: "Cyber Cafe Store Owner Administrator", // 37 characters
      email: "owner2@stores.com",
      password: hashPassword("OwnerP@ss123!"),
      address: "12 Pixel Path, Silicon Quarter, Austin TX 78701",
      role: UserRole.OWNER,
      createdAt: new Date("2026-01-12T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-12T00:00:00.000Z").toISOString()
    },
    {
      id: "user-1",
      name: "Jane Elizabeth Doe Consumer Client", // 35 characters
      email: "jane.doe@example.com",
      password: hashPassword("UserP@ss123!"),
      address: "742 Evergreen Terrace, Springfield OR 97477",
      role: UserRole.USER,
      createdAt: new Date("2026-01-15T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-15T00:00:00.000Z").toISOString()
    },
    {
      id: "user-2",
      name: "Alexander Hamilton Tester Citizen", // 34 characters
      email: "alex.hamilton@example.com",
      password: hashPassword("UserP@ss123!"),
      address: "57 Wall Street Quarter, Financial Zone, New York NY 10005",
      role: UserRole.USER,
      createdAt: new Date("2026-02-01T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-02-01T00:00:00.000Z").toISOString()
    }
  ],
  stores: [
    {
      id: "store-1",
      name: "Fresh Foods Organic Market",
      email: "freshfoods@organic.com",
      address: "234 Organic Avenue, Farmville VT 05401",
      ownerId: "owner-1",
      createdAt: new Date("2026-01-11T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-11T00:00:00.000Z").toISOString()
    },
    {
      id: "store-2",
      name: "Cyber Cafe Pixel & Brews",
      email: "cybercafe@brews.com",
      address: "12 Pixel Path, Silicon Quarter, Austin TX 78701",
      ownerId: "owner-2",
      createdAt: new Date("2026-01-13T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-13T00:00:00.000Z").toISOString()
    },
    {
      id: "store-3",
      name: "Borders Book Nook & Coffee",
      email: "books@borders.com",
      address: "456 Literature Lane, Readstown MA 02111",
      ownerId: "owner-1", // Managed by owner-1 too
      createdAt: new Date("2026-01-20T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-20T00:00:00.000Z").toISOString()
    }
  ],
  ratings: [
    {
      id: "rating-1",
      userId: "user-1",
      storeId: "store-1",
      rating: 5,
      createdAt: new Date("2026-02-05T10:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-02-05T10:00:00.000Z").toISOString()
    },
    {
      id: "rating-2",
      userId: "user-1",
      storeId: "store-2",
      rating: 4,
      createdAt: new Date("2026-02-06T11:30:00.000Z").toISOString(),
      updatedAt: new Date("2026-02-06T11:30:00.000Z").toISOString()
    },
    {
      id: "rating-3",
      userId: "user-2",
      storeId: "store-1",
      rating: 3,
      createdAt: new Date("2026-02-10T14:15:00.000Z").toISOString(),
      updatedAt: new Date("2026-02-10T14:15:00.000Z").toISOString()
    }
  ]
};

// Normalize DATABASE_URL to remove quotes that often get preserved in Windows environments
if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL.trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  process.env.DATABASE_URL = url;
}

// Detect if standard external database URL is configured
const isLocalhostDb =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("localhost") ||
  process.env.DATABASE_URL.includes("127.0.0.1") ||
  process.env.DATABASE_URL.includes("your_password");

let prismaClient: PrismaClient | null = null;
if (!isLocalhostDb) {
  try {
    prismaClient = new PrismaClient();
  } catch (err) {
    console.error("[Prisma Client] Initialization error", err);
  }
}

export function readDatabase(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to read database, returning default", error);
    return DEFAULT_DB;
  }
}

export function writeDatabase(db: DBStructure): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    if (!isLocalhostDb && prismaClient) {
      saveToPostgresAsync(db).catch(err => {
        console.error("[Postgres Background Sync] Save failed", err);
      });
    }
  } catch (error) {
    console.error("Failed to write database", error);
  }
}

/**
 * Background async updates to ensure Neon PostgreSQL and local database.json stay perfectly synchronized.
 */
async function saveToPostgresAsync(db: DBStructure) {
  if (!prismaClient) return;

  try {
    // 1. Sync users
    for (const u of db.users) {
      await prismaClient.user.upsert({
        where: { id: u.id },
        update: {
          name: u.name,
          email: u.email,
          password: u.password || "",
          address: u.address,
          role: u.role as any,
          updatedAt: new Date(u.updatedAt)
        },
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password || "",
          address: u.address,
          role: u.role as any,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt)
        }
      });
    }

    // 2. Sync stores
    for (const s of db.stores) {
      await prismaClient.store.upsert({
        where: { id: s.id },
        update: {
          name: s.name,
          email: s.email,
          address: s.address,
          ownerId: s.ownerId,
          updatedAt: new Date(s.updatedAt)
        },
        create: {
          id: s.id,
          name: s.name,
          email: s.email,
          address: s.address,
          ownerId: s.ownerId,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }
      });
    }

    // 3. Sync ratings
    for (const r of db.ratings) {
      await prismaClient.rating.upsert({
        where: { userId_storeId: { userId: r.userId, storeId: r.storeId } },
        update: {
          rating: r.rating,
          updatedAt: new Date(r.updatedAt)
        },
        create: {
          id: r.id,
          userId: r.userId,
          storeId: r.storeId,
          rating: r.rating,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }
      });
    }
  } catch (err) {
    console.error("[Postgres Sync] Asynchronous sync failure", err);
  }
}

/**
 * Sync active database arrays on server bootstraps.
 */
export async function syncDatabase(): Promise<void> {
  if (isLocalhostDb || !prismaClient) {
    console.log("[Data Sync] Database URL is default Localhost/Empty. Local 'database.json' mode auto-enabled.");
    return;
  }

  try {
    console.log("[Data Sync] Querying Neon PostgreSQL database status...");
    const usersInDb = await prismaClient.user.findMany();

    if (usersInDb.length === 0) {
      console.log("[Data Sync] PostgreSQL is empty. Moving mock client records to PostgreSQL...");
      // Seed default values immediately so user gets started with beautiful pre-populated tables
      const currentLocDb = readDatabase();
      await saveToPostgresAsync(currentLocDb);
      console.log("[Data Sync] Initial seeding finished successfully.");
    }

    // Hydrate everything from PostgreSQL database back into local arrays
    const pgUsers = await prismaClient.user.findMany();
    const pgStores = await prismaClient.store.findMany();
    const pgRatings = await prismaClient.rating.findMany();

    const db: DBStructure = {
      users: pgUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        address: u.address,
        role: u.role as any,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString()
      })),
      stores: pgStores.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        address: s.address,
        ownerId: s.ownerId,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString()
      })),
      ratings: pgRatings.map(r => ({
        id: r.id,
        userId: r.userId,
        storeId: r.storeId,
        rating: r.rating,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      }))
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    console.log(`[Data Sync] Hydrated and synchronized local state with PG: ${db.users.length} users, ${db.stores.length} stores, ${db.ratings.length} ratings.`);
  } catch (err) {
    console.error("[Data Sync] Synchronization load failure. Safely loaded local cache instead.", err);
  }
}

/**
 * Clean mock PrismaClient mimic wrapper matching typical Prisma structures
 */
class MockPrismaClient {
  get user() {
    return {
      findMany: async () => readDatabase().users,
      findUnique: async (args: { where: { id?: string; email?: string } }) => {
        const db = readDatabase();
        if (args.where.id) return db.users.find(u => u.id === args.where.id);
        if (args.where.email) return db.users.find(u => u.email.toLowerCase() === args.where.email!.toLowerCase());
        return null;
      },
      create: async (args: { data: any }) => {
        const db = readDatabase();
        db.users.push(args.data);
        writeDatabase(db);
        return args.data;
      }
    };
  }

  get store() {
    return {
      findMany: async () => readDatabase().stores,
      findUnique: async (args: { where: { id: string } }) => {
        return readDatabase().stores.find(s => s.id === args.where.id) || null;
      },
      create: async (args: { data: any }) => {
        const db = readDatabase();
        db.stores.push(args.data);
        writeDatabase(db);
        return args.data;
      }
    };
  }

  get rating() {
    return {
      findMany: async () => readDatabase().ratings,
      create: async (args: { data: any }) => {
        const db = readDatabase();
        db.ratings.push(args.data);
        writeDatabase(db);
        return args.data;
      }
    };
  }
}

export const prisma = new MockPrismaClient();

