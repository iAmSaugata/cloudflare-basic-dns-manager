import bcrypt from '../lib/bcryptjs.js'

const SESSION_COOKIE = 'cf_dns_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

const AUTH_BCRYPT_HASH = import.meta.env.AUTH_BCRYPT_HASH || import.meta.env.VITE_AUTH_BCRYPT_HASH
const SESSION_SECRET = import.meta.env.SESSION_SECRET || import.meta.env.VITE_SESSION_SECRET

let cachedKeyPromise = null

function bytesToBase64(bytes){
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

function safeEqual(a, b){
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1){
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

async function getKey(){
  if (!SESSION_SECRET) throw new Error('SESSION_SECRET is not configured')
  if (cachedKeyPromise) return cachedKeyPromise
  const subtle = globalThis.crypto && globalThis.crypto.subtle
  if (!subtle) throw new Error('Web Crypto API is not available in this environment')
  const enc = new TextEncoder()
  cachedKeyPromise = subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return cachedKeyPromise
}

async function sign(data){
  const key = await getKey()
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return bytesToBase64(new Uint8Array(sig))
}

function setCookie(value){
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  let cookie = `${SESSION_COOKIE}=${value}; path=/; SameSite=Lax; Max-Age=${maxAge}`
  if (globalThis.location && globalThis.location.protocol === 'https:'){
    cookie += '; Secure'
  }
  document.cookie = cookie
}

function getCookie(name){
  const parts = document.cookie.split(';').map(p => p.trim())
  for (const part of parts){
    if (!part) continue
    const [key, ...rest] = part.split('=')
    if (key === name) return rest.join('=')
  }
  return null
}

export async function verifyPassword(password){
  if (!AUTH_BCRYPT_HASH) throw new Error('AUTH_BCRYPT_HASH is not configured')
  if (typeof password !== 'string' || password.length === 0) return false
  return bcrypt.compareSync(password, AUTH_BCRYPT_HASH)
}

export async function establishSession(){
  const payload = btoa(`${Date.now()}`)
  const signature = await sign(payload)
  setCookie(`${payload}.${signature}`)
}

export function destroySession(){
  document.cookie = `${SESSION_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`
}

export async function hasValidSession(){
  const raw = getCookie(SESSION_COOKIE)
  if (!raw) return false
  const parts = raw.split('.')
  if (parts.length !== 2) return false
  const [payload, signature] = parts
  let expected
  try {
    expected = await sign(payload)
  } catch {
    return false
  }
  if (!safeEqual(signature, expected)) return false
  let timestamp
  try {
    timestamp = Number(atob(payload))
  } catch {
    return false
  }
  if (!Number.isFinite(timestamp)) return false
  if (Date.now() - timestamp > SESSION_TTL_MS) return false
  return true
}

export function authConfigIssues(){
  const issues = []
  if (!AUTH_BCRYPT_HASH) issues.push('AUTH_BCRYPT_HASH')
  if (!SESSION_SECRET) issues.push('SESSION_SECRET')
  if (!import.meta.env.CF_API_TOKEN && !import.meta.env.VITE_CF_API_TOKEN) issues.push('CF_API_TOKEN')
  return issues
}
