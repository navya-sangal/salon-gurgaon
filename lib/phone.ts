/**
 * Accepts an Indian mobile number typed any common way ("98110 12345", "+91 9811012345",
 * "09811012345") and returns it as +91XXXXXXXXXX, or null if it isn't a valid mobile number.
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

/** +919811012345 → "+91 98110 12345" */
export function formatIndianMobile(e164: string): string {
  const d = e164.replace(/^\+91/, "");
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : e164;
}
