/**
 * Extract a single string param from Express route params.
 * In Express 5, params can be `string | string[]`.
 * This helper normalizes to a single string.
 */
export function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
