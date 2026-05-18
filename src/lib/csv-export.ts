type CsvValue = string | number | boolean | null | undefined | Date;

interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvValue;
}

function escapeCsv(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const needsQuote = raw.includes(",") || raw.includes('"') || raw.includes("\n");
  if (!needsQuote) return raw;
  return `"${raw.replaceAll('"', '""')}"`;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsv(c.header)).join(",");
  const lines = rows.map((row) => columns.map((col) => escapeCsv(col.value(row))).join(","));
  return [header, ...lines].join("\n");
}

export function downloadCsv(filename: string, csvText: string): void {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type { CsvColumn };
