/**
 * Return a calendar date in the user's local timezone.
 *
 * Date#toISOString() uses UTC, which can move a study log to the previous
 * or next day for users outside UTC. Date-only values in the tracker should
 * always be based on the local calendar instead.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysUntilDateKey(dateKey: string, from: Date = new Date()): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return 0;

  const target = new Date(year, month - 1, day);
  if (Number.isNaN(target.getTime())) return 0;

  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Returns the YYYY-MM-DD date of the next upcoming FMGE exam session.
 * Standard NBE FMGE sessions are held in late June (~June 28) and mid/late December (~December 20).
 */
export function getNextFmgeSessionDate(from: Date = new Date()): string {
  const year = from.getFullYear();
  const juneSession = new Date(year, 5, 28); // June 28
  const decSession = new Date(year, 11, 20); // Dec 20

  const todayMidnight = new Date(year, from.getMonth(), from.getDate());

  if (todayMidnight.getTime() < juneSession.getTime()) {
    return `${year}-06-28`;
  } else if (todayMidnight.getTime() < decSession.getTime()) {
    return `${year}-12-20`;
  } else {
    return `${year + 1}-06-28`;
  }
}