/**
 * Date and Timezone Utilities for NutriSync
 * Ensures exact local day boundaries [startUTC, endUTC) for user timezones
 */

export function getUserTimezone(user?: { timezone?: string } | null, fallback = "Asia/Kolkata"): string {
  if (user?.timezone && typeof user.timezone === "string" && user.timezone.trim()) {
    try {
      // Validate that Intl supports this timezone
      Intl.DateTimeFormat(undefined, { timeZone: user.timezone.trim() });
      return user.timezone.trim();
    } catch {
      // Invalid timezone string, use fallback
    }
  }
  return fallback;
}

/**
 * Returns today's date in YYYY-MM-DD format for a given timezone
 */
export function getTodayDateString(timezone = "Asia/Kolkata", dateObj: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(dateObj); // Returns "YYYY-MM-DD"
  } catch {
    return dateObj.toISOString().slice(0, 10);
  }
}

/**
 * Given a "YYYY-MM-DD" date string and a timezone (e.g. "Asia/Kolkata"),
 * returns exact UTC Date objects for the start of that day (00:00:00.000 local)
 * and the start of the next day (00:00:00.000 local tomorrow).
 */
export function getDayBoundariesUTC(dateStr: string, timezone = "Asia/Kolkata"): { startUTC: Date; endUTC: Date } {
  const cleanDate = (dateStr || "").trim().slice(0, 10);
  const parts = cleanDate.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { startUTC: start, endUTC: end };
  }

  // Find the exact UTC offset for this specific year-month-day in this timezone
  // We approximate a UTC time near the target local midnight, then adjust using Intl parts
  const approxUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  const getOffsetMinutes = (targetDate: Date, tz: string): number => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      });
      const parts = formatter.formatToParts(targetDate);
      const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "";
      // Match GMT+5:30, GMT-7, UTC+05:30, etc.
      const match = tzPart.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
      if (match) {
        const sign = match[1] === "-" ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const mins = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours * 60 + mins);
      }
    } catch {
      // Fallback: estimate from local date difference
    }

    // Secondary method using parts
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      });
      const dParts = formatter.formatToParts(targetDate);
      const getVal = (t: string) => parseInt(dParts.find((p) => p.type === t)?.value || "0", 10);
      const localY = getVal("year");
      const localM = getVal("month");
      const localD = getVal("day");
      let localH = getVal("hour");
      if (localH === 24) localH = 0;
      const localMin = getVal("minute");
      const localSec = getVal("second");

      const localTimeAsUtc = Date.UTC(localY, localM - 1, localD, localH, localMin, localSec);
      const offsetMs = localTimeAsUtc - targetDate.getTime();
      return Math.round(offsetMs / (60 * 1000));
    } catch {
      return 0; // UTC fallback
    }
  };

  const offsetMinutes = getOffsetMinutes(approxUtc, timezone);

  // Local 00:00:00 is UTC (00:00:00 - offset)
  const startMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMinutes * 60 * 1000;
  const startUTC = new Date(startMs);

  // Calculate next day offset (handles Daylight Savings Transitions accurately)
  const nextDayApprox = new Date(startMs + 24 * 60 * 60 * 1000);
  const nextDayOffsetMinutes = getOffsetMinutes(nextDayApprox, timezone);
  const endMs = Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) - nextDayOffsetMinutes * 60 * 1000;
  const endUTC = new Date(endMs);

  return { startUTC, endUTC, localDateString: dateStr, timezone };
}

/**
 * Returns the local date string "YYYY-MM-DD" for a given timestamp in a user's timezone
 */
export function formatLocalDateFromTimestamp(timestamp: string | Date | number, timezone = "Asia/Kolkata"): string {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return getTodayDateString(timezone);
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
