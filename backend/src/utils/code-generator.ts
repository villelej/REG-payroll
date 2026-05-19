export function generateNextCode(prefix: string, lastCode: string | null | undefined): string {
  if (!lastCode) {
    return `${prefix}-001`;
  }

  // Extract the numeric part. e.g. BR-005 -> 5
  // If no dash is used, match any digits at the end
  const match = lastCode.match(/\d+$/);
  if (!match) {
    // If the last code doesn't end in numbers, fallback to 001
    return `${prefix}-001`;
  }

  const numericPart = match[0];
  const nextNumber = parseInt(numericPart, 10) + 1;
  
  // Keep the same padding length as the original, or default to 3
  const paddingLength = Math.max(3, numericPart.length);
  const nextNumberStr = nextNumber.toString().padStart(paddingLength, '0');

  return `${prefix}-${nextNumberStr}`;
}
