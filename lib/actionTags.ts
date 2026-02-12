/** Priority: High, Medium, Low */
export const PRIORITY_OPTIONS = [
  { value: "high" as const, label: "High", className: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40" },
  { value: "medium" as const, label: "Medium", className: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40" },
  { value: "low" as const, label: "Low", className: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/40" },
] as const;

export type PriorityTag = "high" | "medium" | "low";

