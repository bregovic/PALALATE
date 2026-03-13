import * as XLSX from "xlsx";

/**
 * Exports data to an Excel buffer.
 */
export function exportToExcel(data: any[], sheetName: string = "Data") {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Return as Uint8Array
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Parses an Excel buffer into JSON.
 */
export function parseExcel(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}
