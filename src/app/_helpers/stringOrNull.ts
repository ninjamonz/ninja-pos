export function stringOrNull(value: string | null): string | null {
  if (value === null || value === '') {
    return null;
  }
  return `'${value}'`;
}