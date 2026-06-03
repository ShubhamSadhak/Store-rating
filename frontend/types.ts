/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  OWNER = "OWNER"
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Opt out of password in front-end responses
  address: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  email: string;
  address: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  storeId: string;
  rating: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
}
