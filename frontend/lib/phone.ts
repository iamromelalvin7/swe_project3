/**
 * Ghana phone number → international digits for wa.me / tel: links.
 * "024 123 4567" → "233241234567", "+233 24 123 4567" → "233241234567".
 * Returns null when the input doesn't look like a usable number.
 */
export function toInternationalDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

export function whatsappLink(phone: string): string | null {
  const intl = toInternationalDigits(phone);
  return intl ? `https://wa.me/${intl}` : null;
}

export function telLink(phone: string): string | null {
  const intl = toInternationalDigits(phone);
  return intl ? `tel:+${intl}` : null;
}
