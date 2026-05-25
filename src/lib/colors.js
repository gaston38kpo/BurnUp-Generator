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
  const i = hexToRgb(idealColor)
  return `:root {
  --scope: ${scopeColor};
  --scope-bg: rgba(${s.r}, ${s.g}, ${s.b}, 0.08);
  --scope-border: rgba(${s.r}, ${s.g}, ${s.b}, 0.25);
  --completed: ${completedColor};
  --completed-bg: rgba(${c.r}, ${c.g}, ${c.b}, 0.08);
  --completed-border: rgba(${c.r}, ${c.g}, ${c.b}, 0.25);
  --ideal: ${idealColor};
  --ideal-bg: rgba(${i.r}, ${i.g}, ${i.b}, 0.08);
}
@media (prefers-color-scheme: dark) {
  :root {
    --scope: ${scopeColor};
    --scope-bg: rgba(${s.r}, ${s.g}, ${s.b}, 0.1);
    --scope-border: rgba(${s.r}, ${s.g}, ${s.b}, 0.3);
    --completed: ${completedColor};
    --completed-bg: rgba(${c.r}, ${c.g}, ${c.b}, 0.1);
    --completed-border: rgba(${c.r}, ${c.g}, ${c.b}, 0.3);
    --ideal: ${idealColor};
    --ideal-bg: rgba(${i.r}, ${i.g}, ${i.b}, 0.1);
  }
}`
}
