import { auth } from "@wix/essentials";
import { secrets } from "@wix/secrets";

export const ADMIN_COOKIE = "petflow_admin";
const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

async function secret(name: string): Promise<string> {
  const getSecret = auth.elevate(secrets.getSecretValue);
  const result = await getSecret(name);
  if (!result.value) throw new Error("Admin secret unavailable");
  return result.value;
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

async function signature(payload: string, key: string): Promise<string> {
  const imported = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", imported, encoder.encode(payload)));
}

export async function checkPassword(username: string, password: string): Promise<boolean> {
  if (username !== "orphew" || password.length > 128) return false;
  const expected = await secret("PETFLOW_ADMIN_PASSWORD_SHA256");
  const actual = hex(await crypto.subtle.digest("SHA-256", encoder.encode(password)));
  return equal(actual, expected);
}

export async function createSession(): Promise<string> {
  const payload = `${Date.now()}.${crypto.randomUUID()}`;
  return `${payload}.${await signature(payload, await secret("PETFLOW_ADMIN_SESSION_KEY"))}`;
}

export async function checkSession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const issued = Number(parts[0]);
  if (!Number.isFinite(issued) || issued > Date.now() + 60_000 || Date.now() - issued > SESSION_SECONDS * 1000) return false;
  if (!/^[0-9a-f-]{36}$/.test(parts[1]) || !/^[0-9a-f]{64}$/.test(parts[2])) return false;
  const expected = await signature(`${parts[0]}.${parts[1]}`, await secret("PETFLOW_ADMIN_SESSION_KEY"));
  return equal(parts[2], expected);
}

export const sessionCookieOptions = { httpOnly: true, secure: true, sameSite: "strict" as const, path: "/", maxAge: SESSION_SECONDS };
