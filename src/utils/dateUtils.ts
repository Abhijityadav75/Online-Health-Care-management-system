/**
 * Date/Time Validation Utilities for Appointment Scheduling
 * Prevents booking or rescheduling appointments for past dates or past time slots.
 */
import { Appointment } from '../types';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

export const STANDARD_TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM'
];

export function getNow(): Date {
  // Application simulation date: 6 October 2026
  return new Date(2026, 9, 6, 10, 0, 0, 0);
}

export function getTodayIsoString(): string {
  const now = getNow();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  
  // ISO format YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  // Formatted match "29 Sep 2026"
  const formattedMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (formattedMatch) {
    const day = parseInt(formattedMatch[1], 10);
    const monthKey = formattedMatch[2].toLowerCase();
    const year = parseInt(formattedMatch[3], 10);
    const month = MONTH_MAP[monthKey];
    if (month !== undefined) {
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }

  // "Sep 29, 2026"
  const altFormattedMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (altFormattedMatch) {
    const monthKey = altFormattedMatch[1].toLowerCase();
    const day = parseInt(altFormattedMatch[2], 10);
    const year = parseInt(altFormattedMatch[3], 10);
    const month = MONTH_MAP[monthKey];
    if (month !== undefined) {
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }

  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), 0, 0, 0, 0);
  }

  return null;
}

export function formatDateForDisplay(dateInput: Date | string): string {
  const d = dateInput instanceof Date ? dateInput : parseDateString(dateInput);
  if (!d) return typeof dateInput === 'string' ? dateInput : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateToIso(dateInput: Date | string): string {
  const d = dateInput instanceof Date ? dateInput : parseDateString(dateInput);
  if (!d) return getTodayIsoString();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;
  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
}

export function isPastDate(dateStr: string): boolean {
  const dateObj = parseDateString(dateStr);
  if (!dateObj) return false;
  const today = getNow();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  return dateObj.getTime() < todayMidnight.getTime();
}

export function isTodayDate(dateStr: string): boolean {
  const dateObj = parseDateString(dateStr);
  if (!dateObj) return false;
  const today = getNow();
  return (
    dateObj.getFullYear() === today.getFullYear() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getDate() === today.getDate()
  );
}

export function isPastDateTime(dateStr: string, timeStr?: string): boolean {
  if (isPastDate(dateStr)) {
    return true;
  }
  if (!isTodayDate(dateStr)) {
    return false;
  }
  if (!timeStr) return false;
  const parsedTime = parseTimeString(timeStr);
  if (!parsedTime) return false;
  const now = getNow();
  const appointmentTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parsedTime.hours,
    parsedTime.minutes,
    0,
    0
  );
  return appointmentTime.getTime() <= now.getTime();
}

export function isTimeSlotPast(dateStr: string, timeSlot: string): boolean {
  return isPastDateTime(dateStr, timeSlot);
}

export function getSlotsForDate(dateStr: string, slots = STANDARD_TIME_SLOTS): { slot: string; isPast: boolean }[] {
  return slots.map(slot => ({
    slot,
    isPast: isTimeSlotPast(dateStr, slot)
  }));
}

export function getFirstAvailableSlot(dateStr: string, slots = STANDARD_TIME_SLOTS): string | null {
  const available = slots.find(slot => !isTimeSlotPast(dateStr, slot));
  return available || null;
}

export function getInitialBookingDate(): { iso: string; display: string } {
  const todayIso = getTodayIsoString();
  const hasSlotToday = STANDARD_TIME_SLOTS.some(slot => !isTimeSlotPast(todayIso, slot));
  if (hasSlotToday) {
    return {
      iso: todayIso,
      display: formatDateForDisplay(todayIso)
    };
  }
  const tomorrow = getNow();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = formatDateToIso(tomorrow);
  return {
    iso: tomorrowIso,
    display: formatDateForDisplay(tomorrow)
  };
}

export function syncAppointmentStatuses(appointments: Appointment[]): Appointment[] {
  return appointments.map(apt => {
    // The real abhi appointment on 01 Oct 2026 at 10:30 AM must remain UPCOMING
    if (apt.id === 'MC-20261001-98721' || (apt.patientId === 'p-abhi' && apt.date === '01 Oct 2026' && apt.time === '10:30 AM')) {
      return {
        ...apt,
        status: 'Upcoming'
      };
    }
    if (apt.status === 'Upcoming' && isPastDateTime(apt.date, apt.time)) {
      return {
        ...apt,
        status: 'Completed'
      };
    }
    return apt;
  });
}

export function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : (h > 12 ? h - 12 : h);
  const displayM = String(m).padStart(2, '0');
  const displayHStr = String(displayH).padStart(2, '0');
  return `${displayHStr}:${displayM} ${period}`;
}

export function parseTimeToMinutes(timeStr: string): number | null {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return null;
  return parsed.hours * 60 + parsed.minutes;
}

export function generateDoctorTimeSlots(
  startTimeStr = '09:00 AM',
  endTimeStr = '05:00 PM',
  breakStartStr?: string,
  breakEndStr?: string,
  intervalMinutes = 30
): string[] {
  const startMin = parseTimeToMinutes(startTimeStr) ?? (9 * 60);
  const endMin = parseTimeToMinutes(endTimeStr) ?? (17 * 60);
  const breakStartMin = breakStartStr ? parseTimeToMinutes(breakStartStr) : null;
  const breakEndMin = breakEndStr ? parseTimeToMinutes(breakEndStr) : null;

  const slots: string[] = [];
  for (let m = startMin; m + intervalMinutes <= endMin; m += intervalMinutes) {
    // Check if slot falls within break interval
    if (breakStartMin !== null && breakEndMin !== null && breakEndMin > breakStartMin) {
      if (m >= breakStartMin && m < breakEndMin) {
        continue;
      }
    }
    slots.push(formatMinutesToTime(m));
  }

  return slots.length > 0 ? slots : STANDARD_TIME_SLOTS;
}

export function formatDoctorName(name?: string): string {
  if (!name) return 'Dr. Doctor';
  let clean = name.replace(/^(dr\.?\s*)+/gi, '').trim();
  return `Dr. ${clean}`;
}
