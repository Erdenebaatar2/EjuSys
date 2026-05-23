type XlsxValue = string | number | boolean | null | undefined | Date;
type XlsxStyle = "title" | "group" | "header" | "text" | "center";

type XlsxCell =
  | XlsxValue
  | {
      value: XlsxValue;
      style?: XlsxStyle;
    };

interface XlsxOptions {
  sheetName: string;
  rows: XlsxCell[][];
  columnWidths?: number[];
  merges?: string[];
  freezeRows?: number;
  autoFilter?: string;
}

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const textEncoder = new TextEncoder();

const STYLE_IDS: Record<XlsxStyle, number> = {
  title: 1,
  group: 2,
  header: 3,
  text: 4,
  center: 5,
};

export function downloadXlsx(filename: string, options: XlsxOptions): void {
  const files = buildWorkbookFiles(options);
  const blob = new Blob([new Uint8Array(zipStore(files))], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildWorkbookFiles(options: XlsxOptions): Record<string, string> {
  return {
    "[Content_Types].xml": contentTypesXml(),
    "_rels/.rels": rootRelsXml(),
    "docProps/app.xml": appXml(),
    "docProps/core.xml": coreXml(),
    "xl/workbook.xml": workbookXml(options.sheetName),
    "xl/_rels/workbook.xml.rels": workbookRelsXml(),
    "xl/styles.xml": stylesXml(),
    "xl/worksheets/sheet1.xml": worksheetXml(options),
  };
}

function worksheetXml(options: XlsxOptions): string {
  const sheetRows = options.rows
    .map((row, rowIndex) => rowXml(row, rowIndex + 1))
    .filter(Boolean)
    .join("");
  const cols = options.columnWidths?.length
    ? `<cols>${options.columnWidths
        .map((width, index) => {
          const col = index + 1;
          return `<col min="${col}" max="${col}" width="${width}" customWidth="1"/>`;
        })
        .join("")}</cols>`
    : "";
  const merges = options.merges?.length
    ? `<mergeCells count="${options.merges.length}">${options.merges
        .map((ref) => `<mergeCell ref="${escapeXml(ref)}"/>`)
        .join("")}</mergeCells>`
    : "";
  const pane =
    options.freezeRows && options.freezeRows > 0
      ? `<pane ySplit="${options.freezeRows}" topLeftCell="A${options.freezeRows + 1}" activePane="bottomLeft" state="frozen"/>`
      : "";
  const autoFilter = options.autoFilter
    ? `<autoFilter ref="${escapeXml(options.autoFilter)}"/>`
    : "";

  return `${XML_DECLARATION}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>${cols}<sheetData>${sheetRows}</sheetData>${autoFilter}${merges}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;
}

function rowXml(row: XlsxCell[], rowNumber: number): string {
  const cells = row
    .map((cell, colIndex) => cellXml(cell, rowNumber, colIndex + 1))
    .filter(Boolean)
    .join("");
  if (!cells) return "";
  const height = rowNumber === 1 ? ' ht="28" customHeight="1"' : "";
  return `<row r="${rowNumber}"${height}>${cells}</row>`;
}

function cellXml(cell: XlsxCell, rowNumber: number, colNumber: number): string {
  const normalized = normalizeCell(cell);
  if (normalized.value === null || normalized.value === undefined || normalized.value === "") {
    return "";
  }
  const ref = `${columnName(colNumber)}${rowNumber}`;
  const style = normalized.style ? ` s="${STYLE_IDS[normalized.style]}"` : "";

  if (typeof normalized.value === "number" && Number.isFinite(normalized.value)) {
    return `<c r="${ref}"${style}><v>${normalized.value}</v></c>`;
  }

  const value =
    normalized.value instanceof Date ? normalized.value.toISOString() : normalized.value;
  return `<c r="${ref}"${style} t="inlineStr"><is><t>${escapeXml(String(value))}</t></is></c>`;
}

function normalizeCell(cell: XlsxCell): { value: XlsxValue; style?: XlsxStyle } {
  if (cell !== null && typeof cell === "object" && !(cell instanceof Date) && "value" in cell) {
    return cell;
  }
  return { value: cell };
}

function stylesXml(): string {
  return `${XML_DECLARATION}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCEBFA"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D75BD"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFB7C4D2"/></left><right style="thin"><color rgb="FFB7C4D2"/></right><top style="thin"><color rgb="FFB7C4D2"/></top><bottom style="thin"><color rgb="FFB7C4D2"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

function workbookXml(sheetName: string): string {
  return `${XML_DECLARATION}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
}

function workbookRelsXml(): string {
  return `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
}

function rootRelsXml(): string {
  return `${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
}

function contentTypesXml(): string {
  return `${XML_DECLARATION}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
}

function coreXml(): string {
  const now = new Date().toISOString();
  return `${XML_DECLARATION}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>EjuSys</dc:creator><cp:lastModifiedBy>EjuSys</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
}

function appXml(): string {
  return `${XML_DECLARATION}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>EjuSys</Application></Properties>`;
}

function columnName(index: number): string {
  let value = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    current = Math.floor((current - 1) / 26);
  }
  return value;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function zipStore(files: Record<string, string>): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const [path, content] of Object.entries(files)) {
    const name = textEncoder.encode(path);
    const data = textEncoder.encode(content);
    const crc = crc32(data);
    const localHeader = zipLocalHeader(name, data.length, crc);
    const centralHeader = zipCentralHeader(name, data.length, crc, offset);
    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const centralOffset = offset;
  const entryCount = Object.keys(files).length;
  const end = zipEndHeader(entryCount, centralSize, centralOffset);
  return concatBytes([...localParts, ...centralParts, end]);
}

function zipLocalHeader(name: Uint8Array, size: number, crc: number): Uint8Array {
  return concatBytes([
    u32(0x04034b50),
    u16(20),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    u32(crc),
    u32(size),
    u32(size),
    u16(name.length),
    u16(0),
    name,
  ]);
}

function zipCentralHeader(
  name: Uint8Array,
  size: number,
  crc: number,
  localOffset: number,
): Uint8Array {
  return concatBytes([
    u32(0x02014b50),
    u16(20),
    u16(20),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    u32(crc),
    u32(size),
    u32(size),
    u16(name.length),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    u32(0),
    u32(localOffset),
    name,
  ]);
}

function zipEndHeader(entryCount: number, centralSize: number, centralOffset: number): Uint8Array {
  return concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entryCount),
    u16(entryCount),
    u32(centralSize),
    u32(centralOffset),
    u16(0),
  ]);
}

function u16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function u32(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let i = 0; i < 8; i++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export type { XlsxCell, XlsxStyle, XlsxValue };
