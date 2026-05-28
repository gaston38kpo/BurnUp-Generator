export function hexToRgb(hex) {
  const h = hex.replace('#', '').trim()
  if (!h) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function color(hex, opacity) {
  if (!hex || !hex.replace('#', '').trim()) return 'transparent'
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export function cssVarOverrides(scopeColor, completedColor, idealColor) {
  let out = `:root {\n`
  out += `  --scope: ${scopeColor || 'transparent'};\n`
  out += `  --scope-bg: ${color(scopeColor, 0.08)};\n`
  out += `  --scope-border: ${color(scopeColor, 0.25)};\n`
  out += `  --completed: ${completedColor || 'transparent'};\n`
  out += `  --completed-bg: ${color(completedColor, 0.08)};\n`
  out += `  --completed-border: ${color(completedColor, 0.25)};\n`
  if (idealColor) {
    out += `  --ideal: ${idealColor};\n`
    out += `  --ideal-bg: ${color(idealColor, 0.08)};\n`
  }
  out += `}\n`
  out += `@media (prefers-color-scheme: dark) {\n`
  out += `  :root {\n`
  out += `    --scope: ${scopeColor || 'transparent'};\n`
  out += `    --scope-bg: ${color(scopeColor, 0.1)};\n`
  out += `    --scope-border: ${color(scopeColor, 0.3)};\n`
  out += `    --completed: ${completedColor || 'transparent'};\n`
  out += `    --completed-bg: ${color(completedColor, 0.1)};\n`
  out += `    --completed-border: ${color(completedColor, 0.3)};\n`
  if (idealColor) {
    out += `    --ideal: ${idealColor};\n`
    out += `    --ideal-bg: ${color(idealColor, 0.1)};\n`
  }
  out += `  }\n`
  out += `}\n`
  return out
}
