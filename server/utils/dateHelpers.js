/**
 * Date utility functions
 */

/**
 * Get date in YYYY-MM-DD format
 */
export function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString) {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Get date N days ago
 */
export function daysAgo(days, fromDate = new Date()) {
  const date = new Date(fromDate);
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

/**
 * Get date N days from now
 */
export function daysFromNow(days, fromDate = new Date()) {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Get difference in days between two dates
 */
export function daysDifference(date1, date2) {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get start of year
 */
export function getYearStart(year = new Date().getFullYear()) {
  return `${year}-01-01`;
}

/**
 * Get end of year
 */
export function getYearEnd(year = new Date().getFullYear()) {
  return `${year}-12-31`;
}

/**
 * Get all dates between start and end
 */
export function getDateRange(startDate, endDate) {
  const dates = [];
  const current = parseDate(startDate);
  const end = parseDate(endDate);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Check if date is today
 */
export function isToday(dateString) {
  return dateString === formatDate(new Date());
}

/**
 * Get yesterday's date
 */
export function getYesterday() {
  return daysAgo(1);
}
