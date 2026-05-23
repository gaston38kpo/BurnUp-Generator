/**
 * urlState.js — URL Compression & State Synchronization
 *
 * This module handles serializing the app state to a compressed URL token
 * and deserializing it back. The pipeline is:
 *
 *   WRITE:  state → compact JSON → pako.deflate(raw) → Uint8Array → base64url → ?data=...
 *   READ:   ?data=... → base64url → Uint8Array → pako.inflate() → compact JSON → state
 *
 * Why pako + deflate?
 * - pako is the fastest JS deflate/inflate implementation (port of zlib)
 * - deflate gives ~70-85% compression on JSON strings
 * - base64url encoding is URL-safe (no +/+= issues)
 *
 * Compact JSON format:
 *   Instead of verbose keys like "fechaInicio", "fechaFin", "entries",
 *   we use a short array format to minimize the string before compression:
 *
 *   [startDate, endDate, [date, type, value, ...], ...]
 *     0        1        2..N
 *
 *   Where type is 0=Scope, 1=Completed. This cuts ~40% of the JSON size
 *   before compression even runs.
 */

import pako from 'pako'

// ─── Base64 URL-safe encoding ────────────────────────────────────────────────

/**
 * Encode a Uint8Array to a URL-safe Base64 string.
 * Replaces '+' with '-', '/' with '_', and strips '=' padding.
 */
function uint8ToBase64Url(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Decode a URL-safe Base64 string back to a Uint8Array.
 */
function base64UrlToUint8(str) {
  // Restore standard Base64 padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad === 2) base64 += '=='
  else if (pad === 3) base64 += '='

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ─── State ↔ Compact JSON ─────────────────────────────────────────────────────

/**
 * Convert the full app state to a compact JSON-serializable array.
 *
 * Full state:  { fechaInicio, fechaFin, entries: [{ fecha, tipo, valor }] }
 * Compact:     ["2025-01-01", "2025-01-31", 0, "2025-01-01", 10, 0, "2025-01-05", 5, ...]
 *
 * Format: [startDate, endDate, ...flatEntries]
 *   Each entry = 3 values: [date, value, type]
 *     type: 0 = "Scope", 1 = "Completed"
 */
function stateToCompact(state) {
  const flat = [state.fechaInicio, state.fechaFin]
  for (const entry of state.entries) {
    flat.push(entry.fecha, entry.valor, entry.tipo === 'Completed' ? 1 : 0)
  }
  return flat
}

/**
 * Reconstruct the full app state from the compact array format.
 */
function compactToState(compact) {
  if (!Array.isArray(compact) || compact.length < 2) return null

  const fechaInicio = compact[0]
  const fechaFin = compact[1]
  const entries = []

  // Entries start at index 2, in groups of 3: [date, value, type]
  for (let i = 2; i < compact.length; i += 3) {
    entries.push({
      fecha: String(compact[i]),
      valor: Number(compact[i + 1]) || 0,
      tipo: compact[i + 2] === 1 ? 'Completed' : 'Scope',
    })
  }

  return { fechaInicio, fechaFin, entries }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Compress the app state into a URL-safe token string.
 *
 * Pipeline: state → compact array → JSON → pako.deflate → base64url
 *
 * @param {object} state - The full app state { fechaInicio, fechaFin, entries }
 * @returns {string} URL-safe compressed token
 */
export function encodeState(state) {
  try {
    const compact = stateToCompact(state)
    const json = JSON.stringify(compact)
    // pako.deflate returns Uint8Array; level 9 = max compression for shortest URL
    const compressed = pako.deflate(json, { level: 9 })
    return uint8ToBase64Url(compressed)
  } catch (e) {
    console.error('encodeState failed:', e)
    return ''
  }
}

/**
 * Decompress a URL-safe token string back into the app state.
 *
 * Pipeline: base64url → Uint8Array → pako.inflate → JSON → compact array → state
 *
 * @param {string} token - URL-safe compressed token
 * @returns {object|null} The app state, or null if decoding fails
 */
export function decodeState(token) {
  if (!token) return null
  try {
    const bytes = base64UrlToUint8(token)
    const json = pako.inflate(bytes, { to: 'string' })
    const compact = JSON.parse(json)
    return compactToState(compact)
  } catch (e) {
    console.error('decodeState failed:', e)
    return null
  }
}

/**
 * Read the ?data= token from the current page URL.
 * @returns {string|null}
 */
export function readUrlToken() {
  const params = new URLSearchParams(window.location.search)
  return params.get('data') || null
}

/**
 * Write the token into the URL using history.replaceState (no navigation).
 * This keeps the browser history clean — back button works as expected.
 *
 * @param {string} token
 */
export function writeUrlToken(token) {
  const url = new URL(window.location)
  if (token) {
    url.searchParams.set('data', token)
  } else {
    url.searchParams.delete('data')
  }
  window.history.replaceState(null, '', url.toString())
}
