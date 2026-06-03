/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mock/placeholder utility for Cloudinary asset upload and management.
 * This file can be easily fully integrated with the cloudinary library when required.
 */
export async function uploadImageToCloudinary(fileBuffer: Buffer, folderName: string = "store_ratings"): Promise<string> {
  // Mocking upload delays and returning a placeholder asset URL
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop`);
    }, 500);
  });
}

export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  return true;
}
