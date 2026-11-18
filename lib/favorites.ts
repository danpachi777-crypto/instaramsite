export const favoritesKey = "motion:favorites";
export function readFavorites(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? [...new Set(parsed.filter((slug): slug is string => typeof slug === "string" && /^[a-z0-9][a-z0-9-]{0,100}$/.test(slug)))].slice(0, 500) : [];
  } catch { return []; }
}
