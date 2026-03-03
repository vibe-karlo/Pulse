import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelative(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=3b82f6`;
}

export const SENIORITY_OPTIONS = [
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "c-level", label: "C-Level" },
];

export const DEPARTMENT_OPTIONS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "HR & People",
  "Finance",
  "Legal",
  "Operations",
  "Customer Success",
  "IT",
  "Data & Analytics",
];

export const COUNTRY_OPTIONS = [
  "US",
  "UK",
  "Germany",
  "France",
  "Croatia",
  "Netherlands",
  "Canada",
  "Australia",
  "Japan",
  "Singapore",
  "Brazil",
  "Mexico",
  "India",
  "Spain",
  "Italy",
];

export const REGION_OPTIONS = [
  "North America",
  "Europe",
  "APAC",
  "LATAM",
  "MEA",
];

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "hr", label: "Hrvatski" },
  { value: "nl", label: "Nederlands" },
  { value: "pt", label: "Português" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "it", label: "Italiano" },
];

export function apiErrorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return { status: 401, message: "Unauthorized" };
    }
    if (error.message === "FORBIDDEN") {
      return { status: 403, message: "Forbidden" };
    }
    if (error.message === "ACCOUNT_PENDING") {
      return { status: 403, message: "Account pending approval" };
    }
  }
  return { status: 500, message: "Internal server error" };
}
