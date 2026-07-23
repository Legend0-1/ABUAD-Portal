import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'abuad-portal-secret-key-2025'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'abuad-refresh-secret-key-2025'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateAccessToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(payload: any): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET)
  } catch {
    return null
  }
}

export { JWT_SECRET, JWT_REFRESH_SECRET }
