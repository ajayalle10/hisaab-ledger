// Hisaab backend — paste this entire file into your Apps Script project,
// then deploy it as a Web App (see SETUP.md). It turns the sheet itself into
// the app's API: reads/writes go straight to these tabs, so opening the
// spreadsheet always shows the current, real data.
//
// Everything (including writes) goes through doGet with a JSONP callback,
// because Apps Script Web Apps cannot send the CORS headers a plain fetch()
// from a browser needs — a <script src="..."> tag isn't subject to CORS, so
// that's what the frontend uses instead.

// Paste your spreadsheet ID here — it's the long string in the sheet's URL:
// https://docs.google.com/spreadsheets/d/THIS_PART/edit
const SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';

const COLUMNS = {
  People: ['id', 'name', 'contact', 'notes'],
  Loans: [
    'id', 'personId', 'direction', 'principal', 'dateGiven',
    'interestRatePctPerMonth', 'promisedReturnDate', 'nickname', 'status', 'notes', 'paymentMode',
  ],
  Payments: ['id', 'loanId', 'date', 'totalAmount', 'principalPortion', 'interestPortion', 'paymentMode', 'notes'],
  Transactions: ['id', 'date', 'type', 'amount', 'category', 'paymentMode', 'notes'],
};

function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  let payload = {};
  if (e.parameter.payload) {
    try { payload = JSON.parse(e.parameter.payload); } catch (err) { payload = {}; }
  }

  let result;
  try {
    if (action === 'getPeople') result = { data: readTab('People') };
    else if (action === 'getLoans') result = { data: readTab('Loans') };
    else if (action === 'getPayments') result = { data: readTab('Payments') };
    else if (action === 'getTransactions') result = { data: readTab('Transactions') };
    else if (action === 'createLoan') result = { data: createLoan(payload) };
    else if (action === 'addPayment') result = { data: addPayment(payload) };
    else if (action === 'addTransaction') result = { data: addTransaction(payload) };
    else result = { error: 'Unknown action: ' + action };
  } catch (err) {
    result = { error: String(err) };
  }

  const json = JSON.stringify(result);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// Cached per execution — createLoan alone calls readTab() twice, and each
// SpreadsheetApp.openById() is a real round-trip, not a free lookup.
let cachedSpreadsheet = null;

function getSheet(name) {
  if (!cachedSpreadsheet) cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = cachedSpreadsheet.getSheetByName(name);
  if (!sheet) throw new Error('Missing tab: ' + name + ' — create it with the exact header row from SETUP.md');
  return sheet;
}

function readTab(name) {
  const sheet = getSheet(name);
  const cols = COLUMNS[name];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, cols.length).getValues();
  return values
    .filter(function (row) { return row[0]; })
    .map(function (row) {
      const obj = {};
      cols.forEach(function (col, i) {
        obj[col] = row[i] instanceof Date ? formatDate(row[i]) : row[i];
      });
      return obj;
    });
}

function formatDate(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function appendRow(name, obj) {
  const sheet = getSheet(name);
  const cols = COLUMNS[name];
  const row = cols.map(function (col) {
    const v = obj[col];
    return v === undefined || v === null ? '' : v;
  });
  sheet.appendRow(row);
}

function normalizeName(name) {
  return String(name).trim().toLowerCase().replace(/\s+/g, ' ');
}

function createLoan(input) {
  const people = readTab('People');
  const target = normalizeName(input.personName);
  const match = people.filter(function (p) { return normalizeName(p.name) === target; })[0];

  if (match && !(input.nickname && String(input.nickname).trim())) {
    const loans = readTab('Loans');
    const existingLoanCount = loans.filter(function (l) { return l.personId === match.id; }).length;
    return { needsNickname: true, personId: match.id, personName: match.name, existingLoanCount: existingLoanCount };
  }

  let personId;
  if (match) {
    personId = match.id;
  } else {
    personId = Utilities.getUuid();
    appendRow('People', { id: personId, name: String(input.personName).trim() });
  }

  const loan = {
    id: Utilities.getUuid(),
    personId: personId,
    direction: input.direction,
    principal: input.principal,
    dateGiven: input.dateGiven,
    interestRatePctPerMonth: input.interestRatePctPerMonth,
    promisedReturnDate: input.promisedReturnDate || '',
    nickname: (input.nickname && String(input.nickname).trim()) || '',
    status: 'active',
    notes: input.notes || '',
    paymentMode: input.paymentMode,
  };
  appendRow('Loans', loan);
  return { loan: loan };
}

function addPayment(input) {
  const payment = {
    id: Utilities.getUuid(),
    loanId: input.loanId,
    date: input.date,
    totalAmount: input.totalAmount,
    principalPortion: input.principalPortion || 0,
    interestPortion: input.interestPortion || 0,
    paymentMode: input.paymentMode,
    notes: input.notes || '',
  };
  appendRow('Payments', payment);
  return { payment: payment };
}

function addTransaction(input) {
  const transaction = {
    id: Utilities.getUuid(),
    date: input.date,
    type: input.type,
    amount: input.amount,
    category: input.category,
    paymentMode: input.paymentMode,
    notes: input.notes || '',
  };
  appendRow('Transactions', transaction);
  return { transaction: transaction };
}
