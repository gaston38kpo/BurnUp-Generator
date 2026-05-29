/**
 * UrlStateAdapter.js — Adapter for URL Compression & State Synchronization
 *
 * Port contract (StatePersistence):
 *
 *   encodeState(state: BurnupState): string
 *     Compress the app state into a URL-safe token string.
 *
 *   decodeState(token: string): BurnupState|null
 *     Decompress a URL-safe token string back into the app state.
 *     Returns the state, { error: 'v1_unsupported' }, or null.
 *
 *   readUrlToken(): string|null
 *     Read the ?data= token from the current page URL.
 *
 *   writeUrlToken(token: string): void
 *     Write the token into the URL using history.replaceState (no navigation).
 *
 * Pipeline:
 * WRITE: state -> compact JSON -> pako.deflate(raw) -> Uint8Array -> base64url -> ?data=...
 * READ:  ?data=... -> base64url -> Uint8Array -> pako.inflate() -> compact JSON -> state
 *
 * v6 compact format:
 * [6, title|null, dateFrom|null, dateTo|null, sprintOffset|null, sprintName0, sprintName1, ..., null, sprintIndex, valor, tipo, mode, ...]
 * Prefix 6 = version. sprintOffset at index 4 (null = 0).
 * Entry IDs are NOT stored in URL — regenerated on decode via nextEntryId counter.
 *
 * v5 backward compat: [5, title|null, dateFrom|null, dateTo|null, sprintName0, ...]
 * v4 backward compat: [4, title|null, dateFrom|null, dateTo|null, sprintName0, ...]
 * v3 backward compat: [3, title|null, sprintName0, ...]
 * v2 backward compat: entries are triplets (sprintIndex, valor, tipo), mode defaults to 'relative'
 *
 * v1 handling:
 * If first element is a string (date) or 1, returns { error: 'v1_unsupported' }
 */

import pako from 'pako'

// ─── Base64 URL-safe encoding ────────────────────────────────────────────────

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

function base64UrlToUint8(str) {
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

// ─── State ↔ Compact JSON (v2) ──────────────────────────────────────────────

function stateToCompact(state) {
  const compact = [6, state.title || null, state.dateFrom || null, state.dateTo || null, state.sprintOffset || null]
  for (const s of state.sprints) {
    compact.push(s.name)
  }
  compact.push(null) // sprint sentinel

  const idToIndex = new Map()
  state.sprints.forEach((s, i) => idToIndex.set(s.id, i))

  for (const e of state.entries) {
    const sprintIndex = idToIndex.get(e.sprintId)
    if (sprintIndex === undefined) continue
    compact.push(
      sprintIndex,
      Number(e.valor) || 0,
      e.tipo === 'Completed' ? 1 : 0,
      e.mode === 'absolute' ? 1 : 0
    )
  }

  // Chart config: 0 = linear, 1 = stepAfter; then 0 = no fill, 1 = fill
  const cc = state.chartConfig || {}
  compact.push(null) // chartConfig sentinel
  compact.push(cc.scopeType === 'stepAfter' ? 1 : 0)
  compact.push(cc.completedType === 'stepAfter' ? 1 : 0)
  compact.push(cc.scopeFill !== false ? 1 : 0)
  compact.push(cc.completedFill !== false ? 1 : 0)
  compact.push(cc.scopeColor || '#75AADB')
  compact.push(cc.completedColor || '#FCBF49')
  compact.push(cc.idealColor || '#FFFFFF')
  compact.push(cc.showTrendLine === true ? 1 : 0)
  compact.push(cc.showDates !== false ? 1 : 0)

  return compact
}

function compactToState(compact) {
  if (!Array.isArray(compact) || compact.length === 0) return null

  const version = compact[0]
  if (version === 1 || (typeof version === 'string')) {
    return { error: 'v1_unsupported' }
  }
  if (version < 2 || version > 6) return null

  // v6: [6, title, dateFrom, dateTo, sprintOffset, sprintNames..., null, entries..., null, chartConfig...]
  // v5: [5, title, dateFrom, dateTo, sprintNames..., null, entries..., null, scopeType, completedType]
  // v4: [4, title, dateFrom, dateTo, sprintNames..., null, entries...]
  // v3: [3, title, sprintNames..., null, entries...]
  // v2: [2, title, sprintNames..., null, entries...]
  let title
  let dateFrom
  let dateTo
  let sprintOffset = 0
  let sprintsStart

  if (version >= 4) {
    title = compact.length > 1 && typeof compact[1] === 'string' ? compact[1] : ''
    dateFrom = compact.length > 2 && typeof compact[2] === 'string' ? compact[2] : ''
    dateTo = compact.length > 3 && typeof compact[3] === 'string' ? compact[3] : ''
    if (version >= 6) {
      sprintOffset = compact[4] != null ? Number(compact[4]) : 0
      sprintsStart = 5
    } else {
      sprintsStart = 4
    }
  } else {
    title = compact.length > 1 && typeof compact[1] === 'string' ? compact[1] : ''
    sprintsStart = 2
  }

  const sprints = []
  let i = sprintsStart
  while (i < compact.length && compact[i] !== null) {
    sprints.push({ id: 's' + (i - sprintsStart), name: String(compact[i]) })
    i++
  }
  i++ // skip null sentinel (end of sprints)

  const stride = version === 2 ? 3 : 4
  const entries = []
  let nextEntryId = 1
  // For v5+, stop at the next null sentinel (chartConfig separator)
  while (i + stride - 1 < compact.length && compact[i] !== null) {
    const sprintIndex = compact[i]
    const valor = Number(compact[i + 1]) || 0
    const tipo = compact[i + 2] === 1 ? 'Completed' : 'Scope'
    const mode =
      stride === 4 && compact[i + 3] === 1 ? 'absolute' : 'relative'
    if (sprintIndex >= 0 && sprintIndex < sprints.length) {
      entries.push({ id: 'e' + nextEntryId++, sprintId: sprints[sprintIndex].id, tipo, valor, mode })
    }
    i += stride
  }

  // Parse chartConfig for v5+
  let chartConfig = { scopeType: 'linear', completedType: 'linear', scopeFill: true, completedFill: true, scopeColor: '#75AADB', completedColor: '#FCBF49', idealColor: '#FFFFFF' }
  if (version >= 5 && i < compact.length && compact[i] === null) {
    i++ // skip chartConfig sentinel
    if (i + 1 < compact.length) {
      chartConfig.scopeType = compact[i] === 1 ? 'stepAfter' : 'linear'
      chartConfig.completedType = compact[i + 1] === 1 ? 'stepAfter' : 'linear'
    }
    if (i + 3 < compact.length) {
      chartConfig.scopeFill = compact[i + 2] !== 0
      chartConfig.completedFill = compact[i + 3] !== 0
    }
    if (i + 4 < compact.length && typeof compact[i + 4] === 'string') {
      chartConfig.scopeColor = compact[i + 4]
    }
    if (i + 5 < compact.length && typeof compact[i + 5] === 'string') {
      chartConfig.completedColor = compact[i + 5]
    }
    if (i + 6 < compact.length && typeof compact[i + 6] === 'string') {
      chartConfig.idealColor = compact[i + 6]
    }
    if (i + 7 < compact.length) {
      chartConfig.showTrendLine = compact[i + 7] === 1
    }
    if (i + 8 < compact.length) {
      chartConfig.showDates = compact[i + 8] === 1
    }
  }

  const result = { title, sprints, entries, chartConfig, sprintOffset, nextEntryId }
  if (version >= 4) {
    result.dateFrom = dateFrom
    result.dateTo = dateTo
  }
  return result
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Compress the app state into a URL-safe token string.
 * @param {object} state - { title, sprints: [{id, name}], entries: [{sprintId, tipo, valor, mode}] }
 * @returns {string} URL-safe compressed token
 */
export function encodeState(state) {
  try {
    const compact = stateToCompact(state)
    const json = JSON.stringify(compact)
    const compressed = pako.deflate(json, { level: 6 })
    return uint8ToBase64Url(compressed)
  } catch (e) {
    console.error('encodeState failed:', e)
    return ''
  }
}

/**
 * Decompress a URL-safe token string back into the app state.
 * @param {string} token - URL-safe compressed token
 * @returns {object|null} The app state, or { error: 'v1_unsupported' }, or null
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
