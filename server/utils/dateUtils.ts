/**
 * Ensures that a date value is properly converted to a Date object
 * @param dateValue The date value to process
 * @returns A valid Date object or null if invalid
 */
export function ensureDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  // If it's already a Date object, return it
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }

  // If it's a string, try to parse it
  if (typeof dateValue === "string") {
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  // If it's a number (timestamp), convert it
  if (typeof dateValue === "number") {
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  return null;
}

/**
 * Formats a date for consistent API responses
 * @param date The date to format
 * @returns Formatted date string or null
 */
export function formatDateForResponse(
  date: Date | null | undefined
): string | null {
  if (!date) return null;
  return date.toISOString();
}
