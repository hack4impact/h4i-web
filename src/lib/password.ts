import bcrypt from "bcryptjs";

export function hashPassword(password: string): Promise<string> {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hash(password, salt);
}

export function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
