import bcrypt from "bcryptjs";

function hashPassword(password: string): Promise<string> {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hash(password, salt);
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
