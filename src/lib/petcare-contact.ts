/** Remove invisible/control characters while preserving legitimate names and accents. */
export function normalizePetCareText(input: string, maxLength: number): string {
  return input.normalize("NFC")
    .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizePetCareEmail(input: string): string {
  return input.normalize("NFC")
    .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .trim()
    .slice(0, 254);
}
