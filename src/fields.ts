export type Track = "Visionary" | "Mentor";

export function pickField(fields: Record<string, any>, keys: string[]): any {
  for (const key of keys) {
    const v = fields[key];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

export function toStringArray(value: any): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter((v) => v.trim());
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

export function detectTrack(fields: Record<string, any>): Track | null {
  const raw = pickField(fields, ["Track", "track", "type", "Type"]);
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (normalized === "visionary") return "Visionary";
    if (normalized === "mentor") return "Mentor";
  }
  if (pickField(fields, ["Full Name", "fullName", "Role Selection", "roleSelection"])) {
    return "Visionary";
  }
  if (pickField(fields, ["Handle", "handle", "Superpower", "superpower", "Tools", "tools"])) {
    return "Mentor";
  }
  return null;
}
