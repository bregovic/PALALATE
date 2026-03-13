export function calculateNextRenewal(startDateString: string | Date, billingCycle: string): Date | null {
  if (!startDateString) return null;
  const start = new Date(startDateString);
  if (isNaN(start.getTime())) return null;

  if (billingCycle === "ONEOFF") return null;

  const now = new Date();
  const next = new Date(start);

  // If start date is in the future, that IS the first renewal date
  if (next > now) return next;

  // Otherwise, increment until we reach a date in the future (or today)
  let safety = 0;
  while (next <= now && safety < 1000) {
    safety++;
    switch (billingCycle) {
      case "WEEKLY":
        next.setDate(next.getDate() + 7);
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + 1);
        break;
      case "QUARTERLY":
        next.setMonth(next.getMonth() + 3);
        break;
      case "SEMI_ANNUALLY":
        next.setMonth(next.getMonth() + 6);
        break;
      case "YEARLY":
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        return null;
    }
  }

  return next;
}
