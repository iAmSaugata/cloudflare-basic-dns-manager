import { sha256 } from './sha256.js'

const hasSubtle = typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle
const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null

function encodeUtf8(value){
  if (value instanceof Uint8Array) return value
  if (textEncoder) return textEncoder.encode(value)
  const arr = new Uint8Array(value.length)
  for (let i = 0; i < value.length; i += 1){
    arr[i] = value.charCodeAt(i) & 0xff
  }
  return arr
}

function concatBytes(a, b){
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

function hmacSha256SyncBytes(keyBytes, dataBytes){
  let key = keyBytes
  if (key.length > 64){
    key = sha256(key)
  }
  if (key.length < 64){
    const padded = new Uint8Array(64)
    padded.set(key)
    key = padded
  }

  const oKeyPad = new Uint8Array(64)
  const iKeyPad = new Uint8Array(64)
  for (let i = 0; i < 64; i += 1){
    const b = key[i]
    oKeyPad[i] = b ^ 0x5c
    iKeyPad[i] = b ^ 0x36
  }

  const innerInput = concatBytes(iKeyPad, dataBytes)
  const innerHash = sha256(innerInput)
  const outerInput = concatBytes(oKeyPad, innerHash)
  return sha256(outerInput)
}

async function subtleHmac(keyBytes, dataBytes){
  try {
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await globalThis.crypto.subtle.sign('HMAC', cryptoKey, dataBytes)
    return new Uint8Array(signature)
  } catch (err){
    return null
  }
}

export async function hmacSha256(key, data){
  const keyBytes = encodeUtf8(key)
  const dataBytes = encodeUtf8(data)
  if (hasSubtle){
    const sig = await subtleHmac(keyBytes, dataBytes)
    if (sig) return sig
  }
  return hmacSha256SyncBytes(keyBytes, dataBytes)
}

export function hmacSha256Sync(key, data){
  const keyBytes = encodeUtf8(key)
  const dataBytes = encodeUtf8(data)
  return hmacSha256SyncBytes(keyBytes, dataBytes)
}
