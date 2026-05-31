/**
 * Get current date string in Berlin timezone (or configured APP_TIMEZONE)
 * Format: YYYY-MM-DD
 */
export function getBerlinDateString(date = new Date()): string {
  const timeZone = process.env.APP_TIMEZONE || "Europe/Berlin";
  
  // en-CA format returns YYYY-MM-DD directly, which is extremely robust
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  return formatter.format(date);
}

/**
 * Calculates today's learning day number relative to START_DATE.
 * Day 1 corresponds to START_DATE.
 * If current date is before START_DATE, it falls back to 1.
 */
export function getCurrentDayNumber(): number {
  const startDateStr = process.env.START_DATE || "2026-06-01";
  const todayStr = getBerlinDateString();

  const start = new Date(startDateStr + "T00:00:00");
  const today = new Date(todayStr + "T00:00:00");

  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Enforce minimum day 1
  return diffDays < 1 ? 1 : diffDays;
}
