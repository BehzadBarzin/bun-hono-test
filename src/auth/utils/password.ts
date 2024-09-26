// import bcrypt from 'bcrypt';

// =================================================================================================
/**
 * Generate hash from password or string.
 *
 * @param password - The password to be hashed
 * @returns The hashed password
 */
export async function generateHash(password: string): Promise<string> {
  // Using bcrypt
  // return bcrypt.hash(password, 10);
  // Using Bun
  return await Bun.password.hash(password);
}

// =================================================================================================
/**
 * Validate password with hash
 *
 * @param password - The password to be compared
 * @param hash - The hash to be compared
 * @returns if the password and hash match
 */
export async function validateHash(
  password: string | undefined,
  hash: string | undefined | null,
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  // Using bcrypt
  // return await bcrypt.compare(password, hash);
  // Using Bun
  return await Bun.password.verify(password, hash);
}

// =================================================================================================
