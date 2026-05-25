export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

export function cssVarOverrides(scopeColor, completedColor, idealColor) {
  const s = hexToRgb(scopeColor)
  const c = hexToRgb(completedColor)
  let out = `:root {\n`
  out += `  --scope: ${scopeColor};\n`
  out += `  --scope-bg: rgba(${s.r}, ${s.g}, ${s.b}, 0.08);\n`
  out += `  --scope-border: rgba(${s.r}, ${s.g}, ${s.b}, 0.25);\n`
  out += `  --completed: ${completedColor};\n`
  out += `  --completed-bg: rgba(${c.r}, ${c.g}, ${c.b}, 0.08);\n`
  out += `  --completed-border: rgba(${c.r}, ${c.g}, ${c.b}, 0.25);\n`
  if (idealColor) {
    const i = hexToRgb(idealColor)
    out += `  --ideal: ${idealColor};\n`
    out += `  --ideal-bg: rgba(${i.r}, ${i.g}, ${i.b}, 0.08);\n`
  }
  out += `}\n`
  out += `@media (prefers-color-scheme: dark) {\n`
  out += `  :root {\n`
  out += `    --scope: ${scopeColor};\n`
  out += `    --scope-bg: rgba(${s.r}, ${s.g}, ${s.b}, 0.1);\n`
  out += `    --scope-border: rgba(${s.r}, ${s.g}, ${s.b}, 0.3);\n`
  out += `    --completed: ${completedColor};\n`
  out += `    --completed-bg: rgba(${c.r}, ${c.g}, ${c.b}, 0.1);\n`
  out += `    --completed-border: rgba(${c.r}, ${c.g}, ${c.b}, 0.3);\n`
  if (idealColor) {
    const i = hexToRgb(idealColor)
    out += `    --ideal: ${idealColor};\n`
    out += `    --ideal-bg: rgba(${i.r}, ${i.g}, ${i.b}, 0.1);\n`
  }
  out += `  }\n`
  out += `}\n`
  return out
}
