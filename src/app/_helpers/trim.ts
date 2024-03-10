export function trim(str: string): string {
  // Trim spaces from both ends
  let trimmed = str.trim();

  // Remove extra spaces from the middle
  trimmed = trimmed.replace(/\s+/g, ' ');

  return trimmed;
}