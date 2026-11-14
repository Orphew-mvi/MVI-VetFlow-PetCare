/** PetCare accepts a Brazilian DDD without a prefix and explicit international E.164 numbers. */
export function normalizePetCarePhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  return `+55${digits}`;
}

export function validPetCarePhone(value: string): boolean {
  if (!value) return true; // The phone field is optional in the Wix form.
  if (!/^\+[1-9]\d{1,14}$/.test(value)) return false;
  if (!value.startsWith("+55")) return true;
  const national = value.slice(3);
  return /^[1-9]\d[2-9]\d{7,8}$/.test(national);
}
