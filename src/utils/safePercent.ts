// Returns 0 instead of NaN/Infinity when the denominator is 0 (e.g. no litres on a row)
export function safePercent(part: number, whole: number): number {
  const value = (part / whole) * 100
  return Number.isFinite(value) ? value : 0
}
