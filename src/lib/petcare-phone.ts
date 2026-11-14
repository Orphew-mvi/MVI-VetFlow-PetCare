/** PetCare accepts a Brazilian DDD without a prefix and explicit international E.164 numbers. */
export function normalizePetCarePhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "").slice(0, 15);
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  return `+55${digits.slice(0, 11)}`;
}

export function formatPetCarePhone(value: string): string {
  if (!value.startsWith("+55")) return value;
  const national = value.slice(3);
  if (!national) return "+55";
  if (national.length < 3) return `+55 (${national}`;
  const ddd = national.slice(0, 2);
  const subscriber = national.slice(2);
  const split = subscriber.length === 9 ? 5 : 4;
  const formatted = subscriber.length > split
    ? `${subscriber.slice(0, split)}-${subscriber.slice(split)}`
    : subscriber;
  return `+55 (${ddd})${formatted ? ` ${formatted}` : ""}`;
}

export function validPetCarePhone(value: string): boolean {
  if (!value) return true; // The phone field is optional in the Wix form.
  if (!/^\+[1-9]\d{1,14}$/.test(value)) return false;
  if (!value.startsWith("+55")) return true;
  const national = value.slice(3);
  return /^[1-9]\d[2-9]\d{7,8}$/.test(national);
}
