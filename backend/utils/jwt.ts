/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "store_rating_platform_secret_key_2026";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * Sign a token with the payload
 */
export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

/**
 * Verify a token and return decoded payload
 */
export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
