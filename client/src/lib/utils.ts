import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateWithWeekday(dateOrIso?: string | Date): string {
  const d = typeof dateOrIso === "string" 
    ? (dateOrIso.includes("T") ? new Date(dateOrIso) : new Date(`${dateOrIso}T12:00:00`))
    : (dateOrIso || new Date());
  
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export function formatFullDate(dateOrIso?: string | Date): string {
  const d = typeof dateOrIso === "string" 
    ? (dateOrIso.includes("T") ? new Date(dateOrIso) : new Date(`${dateOrIso}T12:00:00`))
    : (dateOrIso || new Date());
  
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function getWeekdayName(dateOrIso?: string | Date): string {
  const d = typeof dateOrIso === "string" 
    ? (dateOrIso.includes("T") ? new Date(dateOrIso) : new Date(`${dateOrIso}T12:00:00`))
    : (dateOrIso || new Date());
  
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
}

export function isDateToday(dateStr: string): boolean {
  return dateStr === getLocalDateString();
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 16) return "Afternoon";
  if (hour < 20) return "Evening";
  return "Night";
}
