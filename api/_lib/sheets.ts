import { google, sheets_v4 } from 'googleapis';

let cachedClient: sheets_v4.Sheets | undefined;

function getSpreadsheetId(): string {
  const id = process.env.SPREADSHEET_ID;
  if (!id) throw new Error('SPREADSHEET_ID is not configured');
  return id;
}

function getSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const rawKey = process.env.SHEETS_SERVICE_ACCOUNT_KEY;
  if (!rawKey) throw new Error('SHEETS_SERVICE_ACCOUNT_KEY is not configured');
  const credentials = JSON.parse(rawKey) as { client_email: string; private_key: string };

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}

// Every tab stores its `columns` order in row 1 (headers, for humans opening
// the sheet directly) with data starting at row 2, id always in column A.
export async function readTab(tabName: string, columns: string[]): Promise<Record<string, string>[]> {
  const sheets = getSheetsClient();
  const lastCol = String.fromCharCode('A'.charCodeAt(0) + columns.length - 1);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${tabName}!A2:${lastCol}`,
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row[0])
    .map((row) => {
      const record: Record<string, string> = {};
      columns.forEach((col, i) => {
        record[col] = row[i] !== undefined && row[i] !== null ? String(row[i]) : '';
      });
      return record;
    });
}

export async function appendRow(tabName: string, columns: string[], values: Record<string, unknown>): Promise<void> {
  const sheets = getSheetsClient();
  const row = columns.map((col) => {
    const value = values[col];
    return value === undefined || value === null ? '' : value;
  });
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${tabName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

// Sheet row number (1-indexed, header is row 1) of the record whose column A
// equals `id` — null if not found. Looked up fresh each time since rows can
// move if someone manually reorders the sheet.
async function findRowNumberById(tabName: string, id: string): Promise<number | null> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${tabName}!A2:A`,
  });
  const rows = res.data.values ?? [];
  const idx = rows.findIndex((row) => row[0] === id);
  return idx === -1 ? null : idx + 2;
}

export async function updateField(
  tabName: string,
  columns: string[],
  id: string,
  field: string,
  value: unknown,
): Promise<void> {
  const rowNumber = await findRowNumberById(tabName, id);
  if (rowNumber === null) throw new Error(`${tabName} row not found for id ${id}`);
  const columnIndex = columns.indexOf(field);
  if (columnIndex === -1) throw new Error(`Unknown column ${field} on ${tabName}`);
  const colLetter = String.fromCharCode('A'.charCodeAt(0) + columnIndex);
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${tabName}!${colLetter}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value as string | number]] },
  });
}
