export function numberOrNull(value: number | null): number | null {
  if (!value) {
    if (value === 0) {
      return 0;
    }
    return null; // '' considered as null
  }

  return value;
}