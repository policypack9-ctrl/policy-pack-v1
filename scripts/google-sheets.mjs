import process from "node:process";
import { google } from "googleapis";

const spreadsheetId =
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID ??
  "19X7R8OlHlJW14CeKVeTCoXY5Nwwt9cR_3HToHGn0TaA";
const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME ?? "Sheet1";
const keyFile =
  process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY_FILE ??
  ".secrets/google-sheets-service-account.json";

function usage() {
  console.log(`Usage:
  node scripts/google-sheets.mjs list
  node scripts/google-sheets.mjs get-row "Company Name"
  node scripts/google-sheets.mjs set-cell "Company Name" "Column Header" "Value"
  node scripts/google-sheets.mjs append-tsv "Docs/prospects.tsv"`);
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

async function getAllRows(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1000`,
  });

  const rows = response.data.values ?? [];
  if (rows.length === 0) {
    throw new Error("The sheet is empty.");
  }

  const headers = rows[0];
  const dataRows = rows.slice(1).map((row, index) => ({
    rowNumber: index + 2,
    values: headers.reduce((acc, header, headerIndex) => {
      acc[header] = row[headerIndex] ?? "";
      return acc;
    }, {}),
  }));

  return { headers, dataRows };
}

function columnIndexToLetter(index) {
  let current = index + 1;
  let result = "";

  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }

  return result;
}

async function listRows() {
  const sheets = await getSheetsClient();
  const { dataRows } = await getAllRows(sheets);
  console.log(JSON.stringify(dataRows, null, 2));
}

async function getRowByCompany(companyName) {
  const sheets = await getSheetsClient();
  const { dataRows } = await getAllRows(sheets);

  const match = dataRows.find(
    (row) => normalize(row.values.Company) === normalize(companyName),
  );

  if (!match) {
    throw new Error(`Company not found: ${companyName}`);
  }

  console.log(JSON.stringify(match, null, 2));
}

async function setCell(companyName, columnHeader, value) {
  const sheets = await getSheetsClient();
  const { headers, dataRows } = await getAllRows(sheets);

  const row = dataRows.find(
    (entry) => normalize(entry.values.Company) === normalize(companyName),
  );

  if (!row) {
    throw new Error(`Company not found: ${companyName}`);
  }

  const columnIndex = headers.findIndex(
    (header) => normalize(header) === normalize(columnHeader),
  );

  if (columnIndex === -1) {
    throw new Error(`Column not found: ${columnHeader}`);
  }

  const columnLetter = columnIndexToLetter(columnIndex);
  const range = `${sheetName}!${columnLetter}${row.rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [[value]],
    },
  });

  console.log(
    `Updated ${companyName} -> ${columnHeader} = ${value} at ${range}`,
  );
}

function parseTsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("TSV file must contain headers and at least one data row.");
  }

  return lines.map((line) => line.split("\t"));
}

async function appendTsv(tsvFilePath) {
  const { readFile } = await import("node:fs/promises");
  const sheets = await getSheetsClient();
  const { headers } = await getAllRows(sheets);
  const content = await readFile(tsvFilePath, "utf8");
  const rows = parseTsv(content);
  const fileHeaders = rows[0];
  const dataRows = rows.slice(1);

  const headerMismatch =
    fileHeaders.length !== headers.length ||
    fileHeaders.some((header, index) => header !== headers[index]);

  if (headerMismatch) {
    throw new Error("TSV headers do not match the live sheet headers.");
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: dataRows,
    },
  });

  console.log(`Appended ${dataRows.length} rows from ${tsvFilePath}`);
}

async function main() {
  const command = process.argv[2];

  if (!command) {
    usage();
    process.exit(1);
  }

  if (command === "list") {
    await listRows();
    return;
  }

  if (command === "get-row") {
    const companyName = process.argv[3];
    if (!companyName) {
      usage();
      process.exit(1);
    }

    await getRowByCompany(companyName);
    return;
  }

  if (command === "set-cell") {
    const companyName = process.argv[3];
    const columnHeader = process.argv[4];
    const value = process.argv[5] ?? "";

    if (!companyName || !columnHeader) {
      usage();
      process.exit(1);
    }

    await setCell(companyName, columnHeader, value);
    return;
  }

  if (command === "append-tsv") {
    const tsvFilePath = process.argv[3];
    if (!tsvFilePath) {
      usage();
      process.exit(1);
    }

    await appendTsv(tsvFilePath);
    return;
  }

  usage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
