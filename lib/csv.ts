export function csvCell(value: unknown) {
  let text = String(value ?? "");
  // Excel may ignore whitespace/control characters before interpreting formulas.
  if (/^[\s\p{Cc}\p{Cf}]*[=+\-@]/u.test(text) || /^[\t\r\n]/.test(text))
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function csvRow(values: unknown[]) {
  return values.map(csvCell).join(",") + "\r\n";
}
