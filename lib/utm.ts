import { utmKeys } from "@/lib/validation";
export type Attribution = Partial<Record<(typeof utmKeys)[number], string>>;
export function cleanAttribution(params: URLSearchParams): Attribution {
  return Object.fromEntries(
    utmKeys.flatMap((key) => {
      const value = params.get(key);
      return value && value.length <= 100 && /^[\p{L}\p{N} _.\-]+$/u.test(value)
        ? [[key, value]]
        : [];
    }),
  );
}
