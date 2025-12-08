/**
 * Helper function to clamp date ranges for free users
 * Free users can only view data from the last 3 months
 * Pro users can view unlimited historical data
 * 
 * @param isPro - Whether the user has an active Pro subscription
 * @param requestedStartDate - The start date requested by the user (ISO date string or null for "all time")
 * @param requestedEndDate - The end date requested by the user (ISO date string or null for today)
 * @returns Object with clamped start and end dates
 */
export function getEffectiveDateRange(
  isPro: boolean,
  requestedStartDate: string | null,
  requestedEndDate: string | null
): { startDate: string; endDate: string } {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  const endDate = requestedEndDate ? new Date(requestedEndDate) : today;
  
  // For Pro users, return the requested range (or all time if null)
  if (isPro) {
    const startDate = requestedStartDate 
      ? new Date(requestedStartDate)
      : new Date(0); // Beginning of epoch for "all time"
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }
  
  // For free users, clamp to last 3 months
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  threeMonthsAgo.setHours(0, 0, 0, 0); // Start of day
  
  const freeUserStartDate = requestedStartDate 
    ? new Date(Math.max(new Date(requestedStartDate).getTime(), threeMonthsAgo.getTime()))
    : threeMonthsAgo;
  
  return {
    startDate: freeUserStartDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}
