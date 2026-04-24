import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "./password";

test("Hashing a password returns a string different from the original", async () => {
  const pwd = "W2J7}EJ6k;-R";
  expect(await hashPassword(pwd)).not.toBe(pwd);
  const pwd2 = "T@T#37RL";
  expect(await hashPassword(pwd2)).not.toBe(pwd2);
  const pwd3 = "+4ivln9rl#rocRi0lGak_";
  expect(await hashPassword(pwd3)).not.toBe(pwd3);
});

test("The same password hashed twice produces different hashes", async () => {
  const pwd = "hack4impact67!";
  const hashed1 = await hashPassword(pwd);
  const hashed2 = await hashPassword(pwd);
  expect(hashed1).not.toBe(hashed2);

  const pwd2 = "W2J7}EJ6k;-R";
  const hashed3 = await hashPassword(pwd2);
  const hashed4 = await hashPassword(pwd2);
  expect(hashed3).not.toBe(hashed4);
});

test("verifyPassword returns true with the correct password and false with wrong password", async () => {
  const pwd = "hack4impact67!";
  const hashed = await hashPassword(pwd);
  expect(await verifyPassword(pwd, hashed)).toBe(true);
  expect(await verifyPassword("bBQ0>#2@XR7z", hashed)).toBe(false);

  const pwd2 = ">N4y4OMxE5-}!";
  const hashed2 = await hashPassword(pwd2);
  expect(await verifyPassword(pwd2, hashed2)).toBe(true);
  expect(await verifyPassword(">N4y4OMxe5-}", hashed2)).toBe(false);
});
