/**
 * Date utility functions for frontend
 */

export function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export function getTodayString() {
  return formatDate(new Date());
}

export function getDayOfWeek(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getYearStart(year = new Date().getFullYear()) {
  return `${year}-01-01`;
}

export function getYearEnd(year = new Date().getFullYear()) {
  return `${year}-12-31`;
}
