/**
 *  庫存對帳 Apps Script
 *
 * 功能總覽：
 * 1. 今日扣帳：依今日出貨分頁扣除庫存，並在日期欄寫入扣帳後數量。
 * 2. 預覽：只顯示扣帳結果，不寫入庫存。
 * 3. 接續扣帳：在已存在的今日日期欄繼續扣帳。
 * 4. 批次扣帳：依所有出貨分頁日期順序批次扣帳。
 * 5. 從指定日重做：刪除指定日之後的庫存日期欄，重新串聯扣帳。
 * 6. 驗證已存在扣帳：依出貨分頁和手動備註重算，找出庫存差異。
 * 7. 套用驗證修正：把驗證表的建議備註寫回庫存表，並重新計算。
 * 8. 診斷：檢查庫存欄位、出貨分頁、出貨編號與庫存編號是否能對上。
 * 9. 除錯檢查：從指定日期起逐日核對庫存、備註與出貨增減，標示異常並分析可能原因。
 *
 * 設計重點：
 * 1. 驗證/重算時會解析「手動備註」和「系統自動備註」兩種來源，不會漏掉系統自動寫入的備註。
 * 2. 系統自動備註只做識別與顯示，不再參與庫存重算，避免跨批次拆扣時被當成額外扣帳。
 * 3. 手動備註若已能和出貨分頁同一筆店名、數量、單位、加扣方向對上，只標記為已識別，不再額外套用一次。
 * 4. 手動備註若找不到對應出貨分頁，才會作為額外調整納入庫存重算。
 * 5. 退回備註：只要尾端有「退回」或「退貨」，一定視為退回入庫並加回庫存（覆蓋 +/- 號）。
 * 6. 出貨解析支援「+3包」「+ 3 包」「＋3包」「＋ 3 包」等寫法，避免退回數量因空格或全形符號漏判。
 * 7. 退回備註統一寫成「店名 +3 包(退回)」，與出貨、手動備註格式一致。
 * 8. 司機二四補貨/回庫備註：讀「回庫備註」分頁，依編號+到期日把數量寫成庫存日期欄備註並同步調整數字。
 *    - 執行先問司機姓名；備註寫成「司機名-數量」或「司機名+數量」；同司機同方向同數量已存在則自動跳過。
 *    - 只允許星期二、星期四處理；「回」預設寫「-」，標題含補/台北回來/回台中/回庫/加 則寫「+」。
 * 9. 台北補貨清單：讀產品編號、品名規格、數量、單位，依編號+效期加到今日庫存；沒有該效期列會複製同編號列並改效期。
 * 10. 今日扣帳完成後更新每週「提醒」分頁：列出 30 天內到期品項；低庫存只提醒最近 30 天出貨至少 2 次的常出貨品項。
 * 11. 對帳、提醒、司機備註、台北補貨結果都改成每週分頁，每天用區塊分開。
 * 12. 除錯檢查可指定起始日及商品編號，結果寫入「除錯結果」並在原庫存格標色（紅=備註與庫存不符、黃=合計與出貨不符）。
 *
 * ── 關鍵設計 ──
 * - 不可見 marker（U+200B ×3 / U+200C ×3）包夾 script 自動寫入的扣帳明細，使用者手寫備註永遠保留在 marker 外。
 * - 新增日期欄一律 insertColumnsAfter + clearNote()，不複製隔壁欄，避免舊備註被帶過來。
 * - 庫存碼與出貨碼長度不同時自動模糊比對（例：5E vs 5E001）。
 */

const STOCK_SHEETS = [
  {name: '庫存',         cols: 2},
  {name: '特定客戶專用', cols: 1},
];

const UNITS = '包|箱|罐|桶|條|盒|片|瓶|組|散裝|顆|支|袋';
const SHIPMENT_RE = new RegExp('^(.+?)\\s*([+\\-]?)\\s*(\\d+)\\s*(' + UNITS + ')\\s*(.*)$');
const NOTE_AUTO_START = '​​​';
const NOTE_AUTO_END = '‌‌‌';
const NOTE_INVISIBLE_RE = /[​‌﻿]/g;

// 店名本身含數字、且可能與數量黏在一起時，優先用這份清單解析。
// 例如：「店名A92罐」=> 店名A / 92罐，而不是被切成 店名 / 2罐。
const STORE_NAME_HINTS = [
  'AB1',
  'C2',
  'Cafe One',
  'Sweet Two',
];

const EXPIRY_ALERT_DAYS = 30;
const LOW_STOCK_ALERT_QTY = 5;
const LOW_STOCK_SHIPMENT_LOOKBACK_DAYS = 30;
const LOW_STOCK_MIN_SHIPMENT_COUNT = 2;
const CORE_SHEET_ORDER = ['庫存', '特定客戶專用', '回庫備註', '台北補貨清單'];
const PINNED_SHEET_PREFIX = '📌 ';
const DEBUG_ERROR_COLOR = '#f4cccc';
const DEBUG_WARNING_COLOR = '#fff2cc';

// ─────────── 選單 ───────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📦 庫存系統')
    .addItem('今日扣帳', 'runDispatch')
    .addItem('預覽（不寫入）', 'runDispatchDryRun')
    .addItem('📝 接續扣帳（在已存在的今日欄位上繼續扣）', 'runDispatchInPlace')
    .addItem('📝 指定日接續扣帳（讀該日欄位既有備註）', 'runDispatchInPlaceByDate')
    .addItem('🚚 套用司機二四補貨/回庫並調整庫存', 'runApplyDriverTransferNotes')
    .addItem('📥 套用台北補貨清單', 'runApplyTaipeiRestockList')
    .addItem('📅 批次扣帳（一次處理所有出貨分頁）', 'runBatchDispatch')
    .addItem('🔁 從指定日重做（手動改完後重新串聯）', 'runRedoFromDate')
    .addSeparator()
    .addItem('✅ 驗證已存在的扣帳', 'runVerify')
    .addItem('🛠️ 幫我套用驗證表的建議備註並修正', 'runApplyFixes')
    .addItem('🧪 除錯檢查備註與庫存', 'runDebugInventoryAudit')
    .addItem('🔍 診斷（看欄位有沒有偵測到）', 'runDiagnose')
    .addSeparator()
    .addItem('📌 立即整理固定分頁', 'runArrangeCoreSheetsFirst')
    .addItem('📌 啟用新增分頁後自動固定', 'installCoreSheetOrderTrigger')
    .addItem('📌 關閉新增分頁後自動固定', 'uninstallCoreSheetOrderTrigger')
    .addItem('🧹 整理舊報表分頁', 'runConsolidateExistingReportSheets')
    .addToUi();
}

function runDispatch()        { dispatch(false); }
function runDispatchDryRun()  { dispatch(true); }
function runDispatchInPlace() { dispatch(false, {inPlace: true}); }

function runArrangeCoreSheetsFirst() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  arrangeCoreSheetsFirst(ss);
  SpreadsheetApp.getUi().alert('已整理固定分頁', `已把「${CORE_SHEET_ORDER.map(pinnedSheetName).join('、')}」拉回最前面，其他分頁若有圖釘也會自動拿掉。`, SpreadsheetApp.getUi().ButtonSet.OK);
}

function installCoreSheetOrderTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction && trigger.getHandlerFunction() === 'handleSpreadsheetChangeForCoreSheetOrder') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger('handleSpreadsheetChangeForCoreSheetOrder')
    .forSpreadsheet(ss)
    .onChange()
    .create();

  arrangeCoreSheetsFirst(ss);
  SpreadsheetApp.getUi().alert(
    '已啟用自動固定分頁',
    `以後你手動新增、刪除或移動分頁後，程式會自動把「${CORE_SHEET_ORDER.map(pinnedSheetName).join('、')}」拉回最前面，其他分頁若有圖釘也會自動拿掉。`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function uninstallCoreSheetOrderTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction && trigger.getHandlerFunction() === 'handleSpreadsheetChangeForCoreSheetOrder') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  }
  SpreadsheetApp.getUi().alert(
    '已關閉自動固定分頁',
    removed > 0 ? '已關閉自動固定。之後需要整理時，可按「📌 立即整理固定分頁」。' : '目前沒有啟用中的自動固定觸發器。',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function handleSpreadsheetChangeForCoreSheetOrder(e) {
  if (!e || ['INSERT_GRID', 'REMOVE_GRID'].indexOf(e.changeType) < 0) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) arrangeCoreSheetsFirst(ss);
  } finally {
    lock.releaseLock();
  }
}

function arrangeCoreSheetsFirst(ss) {
  const active = ss.getActiveSheet();
  const activeName = active ? stripPinnedSheetPrefix(active.getName()) : '';
  let activeA1 = '';
  try {
    const activeRange = active ? active.getActiveRange() : null;
    activeA1 = activeRange ? activeRange.getA1Notation() : '';
  } catch (err) {}

  normalizeSheetPinNames(ss);
  let pos = 1;
  for (const name of CORE_SHEET_ORDER) {
    let sheet = getSheetByLogicalName(ss, name);
    if (!sheet) continue;
    sheet = pinCoreSheetName(ss, sheet, name);
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(pos);
    pos++;
  }
  const restoreSheet = activeName ? getSheetByLogicalName(ss, activeName) : active;
  if (restoreSheet) {
    ss.setActiveSheet(restoreSheet);
    if (activeA1) {
      try {
        restoreSheet.setActiveRange(restoreSheet.getRange(activeA1));
      } catch (err) {}
    }
  }
}

function stripPinnedSheetPrefix(name) {
  return String(name || '').replace(/^📌\s*/, '').trim();
}

function pinnedSheetName(name) {
  return PINNED_SHEET_PREFIX + stripPinnedSheetPrefix(name);
}

function getSheetByLogicalName(ss, name) {
  const logicalName = stripPinnedSheetPrefix(name);
  return ss.getSheetByName(pinnedSheetName(logicalName)) || ss.getSheetByName(logicalName);
}

function pinCoreSheetName(ss, sheet, logicalName) {
  const targetName = pinnedSheetName(logicalName);
  if (sheet.getName() === targetName) return sheet;
  const existing = ss.getSheetByName(targetName);
  if (existing && existing.getSheetId() !== sheet.getSheetId()) return existing;
  sheet.setName(targetName);
  return sheet;
}

function normalizeSheetPinNames(ss) {
  const core = {};
  CORE_SHEET_ORDER.forEach(name => core[name] = true);
  for (const sheet of ss.getSheets()) {
    const currentName = sheet.getName();
    const logicalName = stripPinnedSheetPrefix(currentName);
    if (core[logicalName] || currentName === logicalName) continue;
    if (!ss.getSheetByName(logicalName)) sheet.setName(logicalName);
  }
}

function getBusinessWeekRange(date) {
  const start = new Date(date.getTime());
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start.getTime());
  end.setDate(start.getDate() + 4);
  end.setHours(0, 0, 0, 0);
  return {start, end};
}

function formatWeekRangeLabel(date) {
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const range = getBusinessWeekRange(date);
  return Utilities.formatDate(range.start, tz, 'M月d日') + '~' + Utilities.formatDate(range.end, tz, 'M月d日');
}

function getWeeklyReportSheetName(prefix, date) {
  return `${prefix}_${formatWeekRangeLabel(date)}`;
}

function getOrCreateReportSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  arrangeCoreSheetsFirst(ss);
  return sheet;
}

function ensureSheetSize(sheet, minRows, minCols) {
  if (sheet.getMaxRows() < minRows) sheet.insertRowsAfter(sheet.getMaxRows(), minRows - sheet.getMaxRows());
  if (sheet.getMaxColumns() < minCols) sheet.insertColumnsAfter(sheet.getMaxColumns(), minCols - sheet.getMaxColumns());
}

function removeReportDateBlock(sheet, blockLabel) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return;

  const labels = sheet.getRange(1, 1, lastRow, 1).getValues().map(r => String(r[0] || '').trim());
  let startIdx = -1;
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === blockLabel) {
      startIdx = i;
      break;
    }
  }
  if (startIdx < 0) return;

  let endIdx = labels.length;
  for (let i = startIdx + 1; i < labels.length; i++) {
    if (/^【.+】$/.test(labels[i])) {
      endIdx = i;
      break;
    }
  }
  sheet.deleteRows(startIdx + 1, endIdx - startIdx);
}

function beginReportDateBlock(sheet, blockLabel, width) {
  removeReportDateBlock(sheet, blockLabel);

  let row = sheet.getLastRow() + 1;
  if (sheet.getLastRow() > 0) {
    ensureSheetSize(sheet, row, width);
    sheet.getRange(row, 1, 1, width).clearContent().clearFormat().clearNote();
    row++;
  }

  ensureSheetSize(sheet, row, width);
  const titleRow = [blockLabel].concat(Array(Math.max(0, width - 1)).fill(''));
  sheet.getRange(row, 1, 1, width).setValues([titleRow])
    .setBackground('#111827')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  return row + 1;
}

function parseFlexibleReportDate(input) {
  if (input instanceof Date) {
    const d = new Date(input.getFullYear(), input.getMonth(), input.getDate());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const s = String(input || '').trim();
  if (!s) return null;

  let m = s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) {
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  m = s.match(/(\d{1,2})月(\d{1,2})[日號]?/);
  if (m) {
    const d = new Date(new Date().getFullYear(), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  m = s.match(/(^|[^0-9])(\d{1,2})[\/\-](\d{1,2})(?![0-9])/);
  if (m) {
    const d = new Date(new Date().getFullYear(), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

function parseReportDateLabel(label) {
  const parsed = parseFlexibleReportDate(label) || parseSingleDateInput(label);
  return parsed || (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
}

function runConsolidateExistingReportSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const items = findConsolidatableReportSheets(ss);
  if (items.length === 0) {
    arrangeCoreSheetsFirst(ss);
    return ui.alert(
      '沒有需要整理的舊報表',
      '目前沒有找到可合併的舊對帳、提醒、司機備註或台北補貨結果分頁。',
      ui.ButtonSet.OK
    );
  }

  const preview = items.slice(0, 20).map(item => `・${item.name} → ${item.targetName}`);
  const more = items.length > 20 ? `\n…還有 ${items.length - 20} 張` : '';
  const ok = ui.alert(
    '整理舊報表分頁',
    `找到 ${items.length} 張可整理的舊報表，會複製到每週彙整分頁：\n\n${preview.join('\n')}${more}\n\n先只會複製整理，下一步才會問你要不要刪掉舊分頁。`,
    ui.ButtonSet.OK_CANCEL
  );
  if (ok !== ui.Button.OK) return;

  const deleteResp = ui.alert(
    '整理完成後要刪掉舊分頁嗎？',
    '選「是」：搬進每週分頁後刪掉舊報表分頁。\n選「否」：只複製合併，舊分頁保留。',
    ui.ButtonSet.YES_NO_CANCEL
  );
  if (deleteResp === ui.Button.CANCEL) return;
  const deleteOld = deleteResp === ui.Button.YES;

  const written = [];
  const failed = [];
  const targetNames = {};
  for (const item of items) {
    try {
      appendExistingReportSheetToWeeklySheet(ss, item);
      targetNames[item.targetName] = true;
      written.push(item);
    } catch (err) {
      failed.push(`${item.name}：${err && err.message ? err.message : err}`);
    }
  }

  let deleted = 0;
  if (deleteOld) {
    for (const item of written) {
      if (targetNames[item.name]) continue;
      const sheet = ss.getSheetByName(item.name);
      if (!sheet || ss.getSheets().length <= 1) continue;
      try {
        ss.deleteSheet(sheet);
        deleted++;
      } catch (err) {
        failed.push(`${item.name}：已合併但刪除失敗`);
      }
    }
  }

  arrangeCoreSheetsFirst(ss);
  ui.alert(
    '舊報表整理完成',
    `已合併 ${written.length} 張舊報表。\n刪除舊分頁：${deleted} 張\n失敗：${failed.length} 張` + (failed.length ? `\n\n${failed.slice(0, 10).join('\n')}` : ''),
    ui.ButtonSet.OK
  );
}

function findConsolidatableReportSheets(ss) {
  const items = [];
  for (const sheet of ss.getSheets()) {
    const info = getReportSheetConsolidationInfo(sheet);
    if (info) items.push(info);
  }
  items.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
    if (a.prefix !== b.prefix) return a.prefix.localeCompare(b.prefix, 'zh-Hant');
    return a.name.localeCompare(b.name, 'zh-Hant');
  });
  return items;
}

function getReportSheetConsolidationInfo(sheet) {
  const name = sheet.getName();
  const logicalName = stripPinnedSheetPrefix(name);
  if (CORE_SHEET_ORDER.indexOf(logicalName) >= 0) return null;
  if (/^(回庫備註|司機備註|補貨備註|司機回庫|司機備註|台北補貨清單|補貨清單|台北補貨|驗證結果)$/.test(logicalName)) return null;
  if (isWeeklyReportSheetName(logicalName)) return null;

  let prefix = '';
  let display = '';
  if (/^對帳_/.test(logicalName)) {
    prefix = '對帳';
    display = '對帳';
  } else if (/^提醒_/.test(logicalName) || logicalName === '庫存提醒') {
    prefix = '提醒';
    display = '提醒';
  } else if (/^司機備註結果/.test(logicalName) || logicalName === '司機備註結果') {
    prefix = '司機備註結果';
    display = '司機備註';
  } else if (/^台北補貨結果/.test(logicalName)) {
    prefix = '台北補貨結果';
    display = '台北補貨';
  } else if (logicalName === '系統處理結果') {
    const type = detectSystemProcessingReportType(sheet);
    if (!type) return null;
    prefix = type.prefix;
    display = type.display;
  } else {
    return null;
  }

  const date = parseFlexibleReportDate(logicalName) || inferReportDateFromFirstColumn(sheet) || parseReportDateLabel('');
  return {
    sheet,
    name,
    prefix,
    display,
    date,
    targetName: getWeeklyReportSheetName(prefix, date),
  };
}

function isWeeklyReportSheetName(name) {
  return /^(對帳|提醒|司機備註結果|台北補貨結果|驗證)_/.test(name) && name.indexOf('~') >= 0;
}

function detectSystemProcessingReportType(sheet) {
  const lastRow = Math.min(sheet.getLastRow(), 10);
  const lastCol = Math.min(sheet.getLastColumn(), 10);
  if (lastRow < 1 || lastCol < 1) return null;
  const text = sheet.getRange(1, 1, lastRow, lastCol).getValues().map(row => row.join('|')).join('|');
  if (/處理日/.test(text) && /方向/.test(text)) return {prefix: '司機備註結果', display: '司機備註'};
  if (/品名規格/.test(text) && /效期/.test(text)) return {prefix: '台北補貨結果', display: '台北補貨'};
  if (/快過期|低庫存|今日庫存/.test(text)) return {prefix: '提醒', display: '提醒'};
  return null;
}

function inferReportDateFromFirstColumn(sheet) {
  const lastRow = Math.min(sheet.getLastRow(), 30);
  if (lastRow < 2) return null;
  const values = sheet.getRange(1, 1, lastRow, 1).getValues();
  let afterDateHeader = false;
  for (let i = 0; i < values.length; i++) {
    const text = String(values[i][0] || '').trim();
    if (/處理日|驗證日|日期/.test(text)) {
      afterDateHeader = true;
      continue;
    }
    if (!afterDateHeader && i === 0) continue;
    const d = parseFlexibleReportDate(values[i][0]);
    if (d) return d;
  }
  return null;
}

function appendExistingReportSheetToWeeklySheet(ss, item) {
  const source = item.sheet;
  const lastRow = source.getLastRow();
  const lastCol = source.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return;

  const target = getOrCreateReportSheet(ss, item.targetName);
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const dateLabel = Utilities.formatDate(item.date, tz, 'M月d日');
  const blockLabel = `【${dateLabel} ${item.display}｜原分頁：${item.name}】`;
  const startRow = beginReportDateBlock(target, blockLabel, lastCol);

  ensureSheetSize(target, startRow + lastRow - 1, lastCol);
  const sourceRange = source.getRange(1, 1, lastRow, lastCol);
  const targetRange = target.getRange(startRow, 1, lastRow, lastCol);
  sourceRange.copyTo(targetRange);

  for (let c = 1; c <= lastCol; c++) {
    try {
      target.setColumnWidth(c, Math.max(target.getColumnWidth(c), source.getColumnWidth(c)));
    } catch (err) {}
  }
}

function runDispatchInPlaceByDate() {
  const ui = SpreadsheetApp.getUi();
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const todayStr = Utilities.formatDate(new Date(), tz, 'M/d');
  const resp = ui.prompt(
    '📝 指定日接續扣帳',
    `輸入要接續扣帳的日期 (M/D)\n空白 = 今天 (${todayStr})\n\n會讀取該日期庫存欄位既有備註，已扣過的同店同數量不會再扣一次。`,
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  const input = resp.getResponseText().trim() || todayStr;
  const targetDate = parseSingleDateInput(input);
  if (!targetDate) return ui.alert('日期格式錯誤', '請用 M/D 格式，例如 5/22', ui.ButtonSet.OK);

  dispatch(false, {inPlace: true, targetDate});
}

// ─────────── 司機二四回庫 / 回台北備註 ───────────

function runApplyDriverTransferNotes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sourceSheet = findDriverTransferSheet(ss);
  if (!sourceSheet) {
    return ui.alert(
      '找不到回庫備註分頁',
      '請新增分頁「回庫備註」，A欄貼編號、B欄貼台中到期日、C欄起貼 /40 這類數量。',
      ui.ButtonSet.OK
    );
  }

  const sourceData = sourceSheet.getDataRange().getValues();
  if (sourceData.length < 2) return ui.alert('沒有資料', '回庫備註分頁沒有可處理的資料。', ui.ButtonSet.OK);

  const driverName = promptTransferDriverName(ui);
  if (!driverName) return;

  const headers = sourceData[0] || [];
  let fallbackDate = null;
  if (hasSimpleDriverTransferHeaders(headers)) {
    fallbackDate = promptDriverTransferDate(ui);
    if (!fallbackDate) return;
  }

  const transferCols = detectDriverTransferColumns(headers, fallbackDate);
  if (transferCols.length === 0) {
    return ui.alert(
      '找不到日期欄',
      '第 3 欄起的標題請用「回」「補」，或「5月26日回」「5月26日補」這類格式。',
      ui.ButtonSet.OK
    );
  }

  const ctxCache = {};
  const sourceOccurrence = {};
  const report = [];
  let applied = 0, duplicated = 0, skipped = 0, missing = 0;

  for (let r = 1; r < sourceData.length; r++) {
    const code = normalizeStockCodeInput(sourceData[r][0]);
    const expiryKey = normalizeExpiryKey(sourceData[r][1]);
    if (!code) continue;

    const sourceKey = code + '|' + expiryKey;
    sourceOccurrence[sourceKey] = (sourceOccurrence[sourceKey] || 0) + 1;
    const occurrence = sourceOccurrence[sourceKey];

    for (const col of transferCols) {
      const qty = parseDriverTransferQty(sourceData[r][col.idx]);
      if (!qty) continue;

      const dateLabel = Utilities.formatDate(col.date, Session.getScriptTimeZone() || 'Asia/Taipei', 'M/d');
      const noteSign = col.sign;
      if (!isDriverTransferDay(col.date)) {
        skipped++;
        report.push([dateLabel, code, formatDriverSourceExpiry(sourceData[r][1]), qty, noteSign, '', '跳過：不是星期二或星期四']);
        continue;
      }

      const ctxList = getDriverStockContextsForDate(ss, col.date, ctxCache);
      if (ctxList.length === 0) {
        missing++;
        report.push([dateLabel, code, formatDriverSourceExpiry(sourceData[r][1]), qty, noteSign, '', '找不到該日期的庫存欄位']);
        continue;
      }

      const target = findDriverStockTarget(ctxList, code, expiryKey, occurrence);
      if (!target) {
        missing++;
        report.push([dateLabel, code, formatDriverSourceExpiry(sourceData[r][1]), qty, noteSign, '', '找不到相同編號 + 到期日']);
        continue;
      }

      const unit = target.ctx.cols.unit !== undefined ? String(target.ctx.data[target.row][target.ctx.cols.unit] || '').trim() : '';
      const noteLine = formatDriverTransferNoteLine(driverName, noteSign, qty, unit || '包');
      const cell = target.ctx.sheet.getRange(target.row + 1, target.ctx.todayLeftCol + 1);
      const existingNote = cell.getNote() || '';
      const appendResult = appendUniqueDriverTransferNote(existingNote, noteLine);

      if (!appendResult.changed) {
        duplicated++;
        report.push([dateLabel, code, formatDriverSourceExpiry(sourceData[r][1]), qty, noteSign, noteLine, '跳過：同司機同方向同數量已存在，未重複備註也未調整數量']);
        continue;
      }

      const qtyResult = applyDriverTransferQuantity(target, noteSign, qty);
      cell.setNote(appendResult.note);
      applied++;
      report.push([dateLabel, code, formatDriverSourceExpiry(sourceData[r][1]), qty, noteSign, noteLine, `已寫入並調整數量：${target.ctx.sheet.getName()} 第 ${target.row + 1} 列，${qtyResult.oldQty} → ${qtyResult.newQty}`]);
    }
  }

  const reportSheetNames = writeDriverTransferReport(ss, report);
  ui.alert(
    '司機二四補貨/回庫備註與庫存調整完成',
    `司機：${driverName}\n已寫入並調整 ${applied} 筆\n已存在跳過 ${duplicated} 筆\n非二四跳過 ${skipped} 筆\n找不到 ${missing} 筆\n\n詳細結果見「${reportSheetNames.join('、')}」分頁。`,
    ui.ButtonSet.OK
  );
}

function findDriverTransferSheet(ss) {
  const named = getSheetByLogicalName(ss, '回庫備註') || getSheetByLogicalName(ss, '司機備註') || getSheetByLogicalName(ss, '補貨備註') || getSheetByLogicalName(ss, '司機回庫') || getSheetByLogicalName(ss, '司機備註');
  if (named) return named;
  const active = ss.getActiveSheet();
  const data = active ? active.getDataRange().getValues() : [];
  const h0 = data[0] || [];
  if (String(h0[0] || '').indexOf('編號') >= 0 && /(到期|效期)/.test(String(h0[1] || ''))) return active;
  return null;
}

function promptTransferDriverName(ui) {
  const resp = ui.prompt(
    '今天是哪位司機？',
    '請輸入要寫進備註的司機姓名。\n備註會寫成「司機名-數量」或「司機名+數量」。',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return '';
  const name = String(resp.getResponseText() || '').trim();
  if (!name) {
    ui.alert('沒有輸入司機', '請輸入司機姓名後再執行。', ui.ButtonSet.OK);
    return '';
  }
  return name;
}

function promptDriverTransferDate(ui) {
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const todayStr = Utilities.formatDate(new Date(), tz, 'M/d');
  const resp = ui.prompt(
    '司機回 / 補日期',
    `這張表使用「回」「補」簡化欄位，請輸入要寫入哪一天的庫存欄位 (M/D)\n空白 = 今天 (${todayStr})`,
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return null;
  const input = resp.getResponseText().trim() || todayStr;
  const targetDate = parseSingleDateInput(input);
  if (!targetDate) {
    ui.alert('日期格式錯誤', '請用 M/D 格式，例如 5/26', ui.ButtonSet.OK);
    return null;
  }
  return targetDate;
}

function hasSimpleDriverTransferHeaders(headers) {
  for (let c = 2; c < headers.length; c++) {
    if (isSimpleDriverTransferHeader(headers[c])) return true;
  }
  return false;
}

function isSimpleDriverTransferHeader(header) {
  const s = String(header || '').trim();
  if (!s) return false;
  if (parseDriverTransferHeaderDate(s)) return false;
  return /回|補|捕|加|\+|減|\-/.test(s);
}

function detectDriverTransferColumns(headers, fallbackDate) {
  const out = [];
  for (let c = 2; c < headers.length; c++) {
    const simpleHeader = isSimpleDriverTransferHeader(headers[c]);
    const date = parseDriverTransferHeaderDate(headers[c]) || (simpleHeader && fallbackDate ? new Date(fallbackDate.getTime()) : null);
    if (!date) continue;
    out.push({idx: c, date, sign: detectDriverTransferSign(headers[c])});
  }
  out.sort((a, b) => a.date - b.date || a.idx - b.idx);
  return out;
}

function parseDriverTransferHeaderDate(header) {
  if (header instanceof Date) {
    const d = new Date(header.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const s = String(header || '').trim();
  let m = s.match(/(\d{1,2})月(\d{1,2})[日號]?/) || s.match(/(\d{1,2})[\/\-](\d{1,2})/);
  if (!m) return null;
  const d = new Date(new Date().getFullYear(), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  d.setHours(0, 0, 0, 0);
  return d;
}

function detectDriverTransferSign(header) {
  const s = String(header || '');
  if (/補|捕|台北.*(回|來)|回來|回台中|回庫|加|\+/.test(s)) return '+';
  return '-';
}

function isDriverTransferDay(date) {
  const day = date.getDay();
  return day === 2 || day === 4;
}

function parseDriverTransferQty(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Math.abs(parseInt(v, 10)) || 0;
  const s = normalizeSigns(String(v || '').trim());
  const m = s.match(/[\/／]?\s*([+\-]?\d+(?:\.\d+)?)/);
  if (!m) return 0;
  return Math.abs(parseInt(m[1], 10)) || 0;
}

function formatDriverTransferNoteLine(driverName, sign, qty, unit) {
  return `${driverName}${sign}${qty}`;
}

function appendUniqueDriverTransferNote(existingNote, noteLine) {
  const target = parseDeductionNoteLine(noteLine, 'manual');
  if (target && noteHasSameMovement(existingNote, target)) {
    return {changed: false, note: existingNote || null};
  }
  const cleanExisting = String(existingNote || '').replace(/\s+$/, '');
  return {changed: true, note: cleanExisting ? cleanExisting + '\n' + noteLine : noteLine};
}

function applyDriverTransferQuantity(target, sign, qty) {
  const ctx = target.ctx;
  const row1 = target.row + 1;
  const qtyCell = ctx.sheet.getRange(row1, ctx.todayLeftCol + 1);
  const oldRaw = qtyCell.getValue();
  const oldQty = isBlankCell(oldRaw) ? 0 : (parseInt(oldRaw, 10) || 0);
  const newQty = sign === '+' ? oldQty + qty : oldQty - qty;
  qtyCell.setValue(isBlankCell(oldRaw) && newQty === 0 ? '' : newQty);

  if (ctx.config && ctx.config.cols === 2 && ctx.todayRightCol !== undefined) {
    const boxCell = ctx.sheet.getRange(row1, ctx.todayRightCol + 1);
    const prevBoxCell = boxCell.getValue();
    const unit = ctx.cols.unit !== undefined ? String(ctx.data[target.row][ctx.cols.unit] || '').trim() : '';
    const name = ctx.cols.name !== undefined ? String(ctx.data[target.row][ctx.cols.name] || '') : '';
    const boxSize = getBoxSize(name, oldQty, String(prevBoxCell || ''));
    if (!isBlankCell(prevBoxCell) || boxSize) {
      const boxStyle = detectBoxStyle(prevBoxCell);
      boxCell.setValue(formatBoxBreakdown(newQty, boxSize, unit, boxStyle));
    }
  }

  return {oldQty, newQty};
}

function noteHasSameMovement(noteText, target) {
  const items = extractNoteDeductions(noteText, []);
  for (const item of items) {
    if ((item.isSwap || false) !== (target.isSwap || false)) continue;
    if ((item.isAdd || false) !== (target.isAdd || false)) continue;
    if ((item.qty || 0) !== (target.qty || 0)) continue;
    if (normalizeStoreKey(item.store) !== normalizeStoreKey(target.store)) continue;
    const unitA = String(item.unit || '').trim();
    const unitB = String(target.unit || '').trim();
    if (unitA && unitB && unitA !== unitB) continue;
    return true;
  }
  return false;
}

function getDriverStockContextsForDate(ss, targetDate, cache) {
  const key = Utilities.formatDate(targetDate, Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy/M/d');
  if (cache[key]) return cache[key];
  ensureStockDateColumnsForDate(ss, targetDate);
  const list = [];
  for (const cfg of STOCK_SHEETS) {
    const sheet = getSheetByLogicalName(ss, cfg.name);
    if (!sheet) continue;
    const ctx = buildVerifyContext(sheet, cfg, targetDate);
    if (!ctx.error) list.push(ctx);
  }
  cache[key] = list;
  return list;
}

function ensureStockDateColumnsForDate(ss, targetDate) {
  for (const cfg of STOCK_SHEETS) {
    const sheet = getSheetByLogicalName(ss, cfg.name);
    if (!sheet) continue;

    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    const cols = detectStockColumns(headers);
    if (cols.code === undefined || cols.name === undefined || cols.expiry === undefined) continue;

    let targetExists = false;
    for (let c = headers.length - 1; c > cols.expiry; c--) {
      if (isSameDate(headers[c], targetDate)) {
        targetExists = true;
        break;
      }
    }
    if (targetExists) continue;

    const nCols = cfg.cols || 1;
    let sourceRightCol = -1;
    for (let c = headers.length - 1; c > cols.expiry; c--) {
      if (!isDateHeader(headers[c])) continue;
      const d = parseDateHeader(headers[c]);
      if (d && d < targetDate) {
        sourceRightCol = c;
        break;
      }
    }

    let insertAfterCol1;
    let sourceLeftCol = -1;
    if (sourceRightCol > cols.expiry) {
      sourceLeftCol = (sourceRightCol > 0 && sameDateHeader(headers[sourceRightCol], headers[sourceRightCol - 1]))
        ? sourceRightCol - 1
        : sourceRightCol;
      insertAfterCol1 = sourceRightCol + 1;
    } else {
      insertAfterCol1 = cols.expiry + 1;
    }

    sheet.insertColumnsAfter(insertAfterCol1, nCols);
    const newLeftCol1 = insertAfterCol1 + 1;
    const lastRow = Math.max(sheet.getLastRow(), 1);

    if (sourceLeftCol >= 0) {
      sheet.getRange(1, sourceLeftCol + 1, lastRow, nCols)
        .copyTo(sheet.getRange(1, newLeftCol1, lastRow, nCols));
      sheet.getRange(1, newLeftCol1, lastRow, nCols).clearNote();
    } else {
      sheet.getRange(1, newLeftCol1, lastRow, nCols).clearContent().clearNote();
    }

    const headerDate = new Date(targetDate.getTime());
    const headerRow = nCols === 2 ? [headerDate, headerDate] : [headerDate];
    sheet.getRange(1, newLeftCol1, 1, nCols)
      .setValues([headerRow])
      .setNumberFormat('M月d日')
      .setFontWeight('bold');
  }
}

function findDriverStockTarget(ctxList, code, expiryKey, occurrence) {
  const candidates = [];
  for (const ctx of ctxList) {
    for (let r = 1; r < ctx.data.length; r++) {
      const stockCode = normalizeStockCodeInput(ctx.data[r][ctx.cols.code]);
      if (stockCode !== code) continue;
      const stockExpiryKey = normalizeExpiryKey(ctx.data[r][ctx.cols.expiry]);
      if (expiryKey && stockExpiryKey !== expiryKey) continue;
      candidates.push({ctx, row: r});
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.min((occurrence || 1) - 1, candidates.length - 1)];
}

function normalizeStockCodeInput(v) {
  return String(v || '').replace(/　/g, ' ').trim();
}

function normalizeExpiryKey(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) return `${v.getFullYear()}/${v.getMonth() + 1}/${v.getDate()}`;
  if (typeof v === 'number' && v > 20000) {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  }
  const s = String(v || '').replace(/　/g, ' ').trim();
  if (s === '//' || /無保存期限|沒效期/.test(s)) return s;
  if (/^\d+$/.test(s) && parseInt(s, 10) > 20000) {
    const d = new Date(Math.round((parseInt(s, 10) - 25569) * 86400000));
    return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  }
  const m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return `${parseInt(m[1], 10)}/${parseInt(m[2], 10)}/${parseInt(m[3], 10)}`;
  return s;
}

function formatDriverSourceExpiry(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy/M/d');
  return String(v || '').trim();
}

function writeDriverTransferReport(ss, report) {
  const header = ['處理日', '編號', '到期日', '數量', '方向', '備註', '結果'];
  const groups = {};
  for (const row of report || []) {
    const targetDate = parseReportDateLabel(row[0]);
    const sheetName = getWeeklyReportSheetName('司機備註結果', targetDate);
    if (!groups[sheetName]) groups[sheetName] = {date: targetDate, rows: []};
    groups[sheetName].rows.push(row);
  }
  if (Object.keys(groups).length === 0) {
    const targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);
    const sheetName = getWeeklyReportSheetName('司機備註結果', targetDate);
    groups[sheetName] = {date: targetDate, rows: []};
  }

  const written = [];
  for (const sheetName of Object.keys(groups)) {
    const group = groups[sheetName];
    const sheet = getOrCreateReportSheet(ss, sheetName);
    const blockLabel = `【${Utilities.formatDate(group.date, Session.getScriptTimeZone() || 'Asia/Taipei', 'M月d日')} 司機備註】`;
    let row = beginReportDateBlock(sheet, blockLabel, header.length);

    sheet.getRange(row, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#e5e7eb');
    row++;
    if (group.rows.length) sheet.getRange(row, 1, group.rows.length, header.length).setValues(group.rows);
    else sheet.getRange(row, 1).setValue('沒有處理資料');
    sheet.autoResizeColumns(1, header.length);
    written.push(sheetName);
  }
  arrangeCoreSheetsFirst(ss);
  return written;
}

// ─────────── 台北補貨清單 ───────────

function runApplyTaipeiRestockList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sourceSheet = findTaipeiRestockSheet(ss);
  if (!sourceSheet) {
    return ui.alert(
      '找不到台北補貨清單',
      '請新增分頁「台北補貨清單」，欄位需有：產品編號、品名規格、數量、單位。',
      ui.ButtonSet.OK
    );
  }

  const data = sourceSheet.getDataRange().getValues();
  if (data.length < 2) return ui.alert('沒有資料', '台北補貨清單沒有可處理的資料。', ui.ButtonSet.OK);

  const block = getLatestTaipeiRestockBlock(data);
  if (!block) {
    return ui.alert(
      '欄位不足',
      '台北補貨清單需要「產品編號 / 品名規格 / 數量」欄位。\n如果要保留舊資料，請在最下面空一列後，再貼一次含標題的新清單。',
      ui.ButtonSet.OK
    );
  }
  const cols = block.cols;

  const driverName = promptTransferDriverName(ui);
  if (!driverName) return;

  const targetDate = new Date();
  targetDate.setHours(0, 0, 0, 0);
  const report = [];
  let applied = 0, inserted = 0, duplicated = 0, missing = 0, skipped = 0;

  for (let r = block.startRow; r <= block.endRow; r++) {
    const code = normalizeStockCodeInput(data[r][cols.code]);
    if (!code || code === 'X0000') { skipped++; continue; }

    const qty = parseTaipeiRestockQty(data[r][cols.qty]);
    if (!qty) { skipped++; continue; }

    const spec = String(data[r][cols.name] || '').trim();
    const expiryDate = parseTaipeiRestockExpiry(spec);
    if (!expiryDate) {
      missing++;
      report.push([code, spec, '', qty, '', '', '找不到品名規格前面的效期，已跳過']);
      continue;
    }

    const targetInfo = getTaipeiRestockTarget(ss, code, expiryDate, targetDate);
    if (!targetInfo || !targetInfo.target) {
      missing++;
      report.push([code, spec, formatTaipeiRestockExpiry(expiryDate), qty, '', '', '庫存找不到相同編號，無法新增效期列']);
      continue;
    }

    const target = targetInfo.target;
    const noteLine = formatDriverTransferNoteLine(driverName, '+', qty, '');
    const cell = target.ctx.sheet.getRange(target.row + 1, target.ctx.todayLeftCol + 1);
    const existingNote = cell.getNote() || '';
    const appendResult = appendUniqueDriverTransferNote(existingNote, noteLine);
    if (!appendResult.changed) {
      duplicated++;
      report.push([code, spec, formatTaipeiRestockExpiry(expiryDate), qty, target.ctx.sheet.getName(), noteLine, '跳過：同司機同數量補貨備註已存在，未重複加庫存']);
      continue;
    }

    const qtyResult = applyDriverTransferQuantity(target, '+', qty);
    cell.setNote(appendResult.note);
    applied++;
    if (targetInfo.inserted) inserted++;
    report.push([
      code, spec, formatTaipeiRestockExpiry(expiryDate), qty, target.ctx.sheet.getName(), noteLine,
      `${targetInfo.inserted ? '已新增效期列並加庫存' : '已加庫存'}：第 ${target.row + 1} 列，${qtyResult.oldQty} → ${qtyResult.newQty}`
    ]);
  }

  const reportSheetName = writeTaipeiRestockReport(ss, report, targetDate);
  ui.alert(
    '台北補貨清單完成',
    `司機：${driverName}\n本次處理：第 ${block.headerRow + 1} 列標題下面的最新一段\n已加庫存 ${applied} 筆\n其中新增效期列 ${inserted} 筆\n已存在跳過 ${duplicated} 筆\n其他跳過 ${skipped} 筆\n找不到 ${missing} 筆\n\n詳細結果見「${reportSheetName}」分頁。`,
    ui.ButtonSet.OK
  );
}

function findTaipeiRestockSheet(ss) {
  const named = getSheetByLogicalName(ss, '台北補貨清單') || getSheetByLogicalName(ss, '補貨清單') || getSheetByLogicalName(ss, '台北補貨');
  if (named) return named;
  const active = ss.getActiveSheet();
  const data = active ? active.getDataRange().getValues() : [];
  return getLatestTaipeiRestockBlock(data) ? active : null;
}

function getLatestTaipeiRestockBlock(data) {
  let headerRow = -1;
  let cols = null;
  for (let r = 0; r < data.length; r++) {
    const detected = detectTaipeiRestockColumns(data[r] || []);
    if (detected.code >= 0 && detected.name >= 0 && detected.qty >= 0) {
      headerRow = r;
      cols = detected;
    }
  }
  if (headerRow < 0) return null;

  let endRow = data.length - 1;
  for (let r = headerRow + 1; r < data.length; r++) {
    if (isBlankTaipeiRestockRow(data[r], cols)) {
      endRow = r - 1;
      break;
    }
  }
  if (endRow < headerRow + 1) return null;
  return {cols, headerRow, startRow: headerRow + 1, endRow};
}

function isBlankTaipeiRestockRow(row, cols) {
  if (!row) return true;
  const idxs = [cols.code, cols.name, cols.qty, cols.unit].filter(i => i >= 0);
  return idxs.every(i => String(row[i] || '').trim() === '');
}

function detectTaipeiRestockColumns(headers) {
  const cols = {code: -1, name: -1, qty: -1, unit: -1};
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c] || '').replace(/\s+/g, '');
    if (cols.code < 0 && /(產品編號|商品編號|編號|品號)/.test(h)) cols.code = c;
    else if (cols.name < 0 && /(品名規格|品名|規格|名稱)/.test(h)) cols.name = c;
    else if (cols.qty < 0 && /數量/.test(h)) cols.qty = c;
    else if (cols.unit < 0 && /單位/.test(h)) cols.unit = c;
  }
  return cols;
}

function parseTaipeiRestockQty(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Math.abs(parseInt(v, 10)) || 0;
  const s = String(v || '').replace(/,/g, '').trim();
  const m = s.match(/([+\-]?\d+(?:\.\d+)?)/);
  return m ? (Math.abs(parseInt(m[1], 10)) || 0) : 0;
}

function parseTaipeiRestockExpiry(spec) {
  const s = String(spec || '').trim();
  let m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?=$|[\s\-])/);
  if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));

  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})(?=$|[\s\-])/);
  if (m) return new Date(new Date().getFullYear(), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  return null;
}

function formatTaipeiRestockExpiry(d) {
  return d ? `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}` : '';
}

function getTaipeiRestockTarget(ss, code, expiryDate, targetDate) {
  const expiryKey = normalizeExpiryKey(expiryDate);
  let ctxList = getDriverStockContextsForDate(ss, targetDate, {});
  let target = findDriverStockTarget(ctxList, code, expiryKey, 1);
  if (target) return {target, inserted: false};

  const template = findTaipeiRestockTemplate(ctxList, code);
  if (!template) return null;

  insertTaipeiRestockExpiryRow(template, expiryDate);
  ctxList = getDriverStockContextsForDate(ss, targetDate, {});
  target = findDriverStockTarget(ctxList, code, expiryKey, 1);
  return target ? {target, inserted: true} : null;
}

function findTaipeiRestockTemplate(ctxList, code) {
  let found = null;
  for (const ctx of ctxList) {
    for (let r = 1; r < ctx.data.length; r++) {
      if (normalizeStockCodeInput(ctx.data[r][ctx.cols.code]) === code) found = {ctx, row: r};
    }
  }
  return found;
}

function insertTaipeiRestockExpiryRow(template, expiryDate) {
  const ctx = template.ctx;
  const sheet = ctx.sheet;
  const sourceRow1 = template.row + 1;
  const newRow1 = sourceRow1 + 1;
  const lastCol = sheet.getLastColumn();

  sheet.insertRowsAfter(sourceRow1, 1);
  const sourceRange = sheet.getRange(sourceRow1, 1, 1, lastCol);
  const newRange = sheet.getRange(newRow1, 1, 1, lastCol);
  sourceRange.copyTo(newRange);
  newRange.clearNote();

  const dateStartCol = ctx.cols.expiry + 2;
  if (dateStartCol <= lastCol) sheet.getRange(newRow1, dateStartCol, 1, lastCol - dateStartCol + 1).clearContent().clearNote();

  const expiryCell = sheet.getRange(newRow1, ctx.cols.expiry + 1);
  expiryCell
    .setValue(expiryDate)
    .setNumberFormat('yyyy/M/d')
    .setBackground(null);
}

function writeTaipeiRestockReport(ss, report, targetDate) {
  targetDate = targetDate || new Date();
  const name = getWeeklyReportSheetName('台北補貨結果', targetDate);
  const sheet = getOrCreateReportSheet(ss, name);
  const header = ['編號', '品名規格', '效期', '數量', '庫存分頁', '備註', '結果'];
  const blockLabel = `【${Utilities.formatDate(targetDate, Session.getScriptTimeZone() || 'Asia/Taipei', 'M月d日')} 台北補貨】`;
  let row = beginReportDateBlock(sheet, blockLabel, header.length);

  sheet.getRange(row, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#e5e7eb');
  row++;
  if (report.length) sheet.getRange(row, 1, report.length, header.length).setValues(report);
  else sheet.getRange(row, 1).setValue('沒有處理資料');
  sheet.autoResizeColumns(1, header.length);
  arrangeCoreSheetsFirst(ss);
  return name;
}

// ─────────── 診斷 ───────────

function runDiagnose() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const lines = [];
  lines.push(`今天：${todayLabel()}`);

  const allStockCodes = new Set();
  for (const cfg of STOCK_SHEETS) {
    const sheet = getSheetByLogicalName(ss, cfg.name);
    lines.push('');
    lines.push(`【庫存分頁】「${cfg.name}」（每日 ${cfg.cols} 欄）` + (sheet ? ' ✅' : ' ❌ 找不到（會跳過）'));
    if (!sheet) continue;
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    lines.push(`  標頭共 ${headers.length} 欄、資料 ${data.length - 1} 列`);
    lines.push('  前 8 欄：');
    headers.slice(0, 8).forEach((h, i) => lines.push(`    ${colLetter(i)}：「${formatHeader(h)}」`));
    if (headers.length > 13) {
      lines.push('  後 5 欄（找最右日期用）：');
      for (let i = headers.length - 5; i < headers.length; i++) {
        lines.push(`    ${colLetter(i)}：「${formatHeader(headers[i])}」${isDateHeader(headers[i]) ? ' 📅' : ''}`);
      }
    }
    const cols = detectStockColumns(headers);
    lines.push(`  偵測欄位：編號→${fmtCol(cols.code)}｜品名→${fmtCol(cols.name)}｜單位→${fmtCol(cols.unit)}｜到期日→${fmtCol(cols.expiry)}`);
    if (cols.code !== undefined && data.length > 1) {
      const sample = [];
      for (let r = 1; r < Math.min(data.length, 11); r++) {
        const c = String(data[r][cols.code]).trim();
        if (c) { sample.push(c); allStockCodes.add(c); }
      }
      for (let r = 1; r < data.length; r++) {
        const c = String(data[r][cols.code]).trim();
        if (c) allStockCodes.add(c);
      }
      lines.push(`  編號前 10 筆樣本：${sample.join(', ')}`);
    }
  }

  const shipSheet = findShipmentSheet(ss);
  lines.push('');
  lines.push(`【今日出貨分頁】` + (shipSheet ? `「${shipSheet.getName()}」 ✅` : ' ❌ 找不到'));
  if (!shipSheet) {
    lines.push(`  期待格式：${shipmentSheetCandidates().join(' / ')}`);
    const existing = ss.getSheets().map(s => s.getName()).filter(n => /出貨/.test(n));
    if (existing.length) lines.push(`  目前有出貨分頁：${existing.join(', ')}`);
  } else {
    const data = shipSheet.getDataRange().getValues();
    lines.push(`  共 ${data.length} 列`);
    const ships = parseShipments(data);
    const codes = Object.keys(ships);
    lines.push(`  解析到 ${codes.length} 個編號`);

    const stockCodesObj = {};
    [...allStockCodes].forEach(k => stockCodesObj[k] = true);
    const missing = codes.filter(c => !stockCodesObj[c] && !findFuzzyCode(stockCodesObj, c));
    lines.push('');
    lines.push('【交叉檢查（全部庫存分頁合併）】');
    lines.push(`  出貨編號：${codes.length}｜庫存編號：${allStockCodes.size}`);
    lines.push(`  出貨有、庫存找不到：${missing.length} 個`);
    if (missing.length) lines.push(`    ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? ' …' : ''}`);
  }

  ui.alert('🔍 診斷結果', lines.join('\n'), ui.ButtonSet.OK);
}

function fmtCol(idx) { return idx !== undefined ? colLetter(idx) : '❌'; }

// ─────────── 主流程 ───────────

function dispatch(dryRun, opts) {
  opts = opts || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const silent = !!opts.silent;
  const inPlace = !!opts.inPlace;
  const recompute = !!opts.recompute;
  const targetDate = opts.targetDate || (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  })();
  const targetLabel = Utilities.formatDate(targetDate, Session.getScriptTimeZone() || 'Asia/Taipei', 'M月d日');

  const sheetCtx = [];
  const missing = [];
  for (const cfg of STOCK_SHEETS) {
    const sheet = getSheetByLogicalName(ss, cfg.name);
    if (!sheet) { missing.push(cfg.name); continue; }
    const ctx = (inPlace || recompute) ? buildVerifyContext(sheet, cfg, targetDate) : buildSheetContext(sheet);
    if (ctx.error) {
      if (silent) return {error: `分頁「${cfg.name}」：${ctx.error}`};
      ui.alert(`分頁「${cfg.name}」`, ctx.error, ui.ButtonSet.OK);
      return;
    }
    ctx.config = cfg;
    if (inPlace) {
      ctx.prevLeftCol  = ctx.todayLeftCol; ctx.prevRightCol = ctx.todayRightCol;
    } else if (recompute) {
      ctx.prevLeftCol  = ctx.yesterdayLeftCol; ctx.prevRightCol = ctx.yesterdayRightCol;
    }
    sheetCtx.push(ctx);
  }
  if (sheetCtx.length === 0) {
    ui.alert(`找不到任何庫存分頁。期待：${STOCK_SHEETS.map(s => s.name).join('、')}`);
    return;
  }

  const shipSheet = opts.shipSheet || findShipmentSheet(ss, targetDate);
  if (!shipSheet) {
    if (silent) return {error: '找不到出貨分頁'};
    ui.alert(`找不到 ${targetLabel} 的出貨分頁`, '請確認名稱。', ui.ButtonSet.OK);
    return;
  }
  const today = targetLabel;

  if (!inPlace && !recompute) {
    const alreadyToday = sheetCtx.filter(c => isSameDate(c.headers[c.prevRightCol], targetDate));
    if (alreadyToday.length && !dryRun) {
      if (silent) return {skipped: true, reason: `${targetLabel} 已存在，跳過`};
      const ok = ui.alert(`${today} 已經扣過？`, '要再插入新欄嗎？', ui.ButtonSet.OK_CANCEL);
      if (ok !== ui.Button.OK) return;
    }
  }

  const shipData = shipSheet.getDataRange().getValues();
  const shipments = parseShipments(shipData);
  const shipMovementMap = buildShipMovementMap(shipments);

  const skuBatches = {};
  sheetCtx.forEach((ctx, sIdx) => {
    let allNotes = [];
    if ((recompute || inPlace) && ctx.todayLeftCol !== undefined && ctx.data.length > 1) {
      allNotes = ctx.sheet.getRange(2, ctx.todayLeftCol + 1, ctx.data.length - 1, 1).getNotes();
    }
    for (let r = 1; r < ctx.data.length; r++) {
      const code = String(ctx.data[r][ctx.cols.code]).trim();
      if (!code) continue;
      const prevQty = parseInt(ctx.data[r][ctx.prevLeftCol], 10) || 0;
      const prevBox = String(ctx.data[r][ctx.prevRightCol] || '').trim();

      let startQty = prevQty;
      let manualList = [];
      let noteDeductions = [];
      if ((recompute || inPlace) && allNotes[r - 1]) {
        const noteText = allNotes[r - 1][0];
        noteDeductions = extractNoteDeductions(noteText, getShipMovementsForCode(shipMovementMap, code));
        if (recompute) {
          manualList = noteDeductions.filter(d => d.appliesToStock);
          let delta = 0;
          for (const d of manualList) delta += d.isAdd ? d.qty : -d.qty;
          startQty = prevQty + delta;
        }
      }

      if (!skuBatches[code]) skuBatches[code] = [];
      skuBatches[code].push({
        sheetIdx: sIdx, row: r, expiry: ctx.data[r][ctx.cols.expiry],
        stockNote: ctx.cols.note !== undefined ? String(ctx.data[r][ctx.cols.note] || '').trim() : '',
        prevQty: prevQty, prevBox: prevBox, newQty: startQty, manualDeductions: manualList, noteDeductions,
      });
    }
  });

  const dispatchLog = [];
  const warnings = [];

  for (const code of Object.keys(shipments)) {
    const ship = shipments[code];
    let batches = skuBatches[code];
    if (!batches) {
      const fuzzyCode = findFuzzyCode(skuBatches, code);
      if (fuzzyCode) batches = skuBatches[fuzzyCode];
    }
    if (!batches) {
      ship.items.forEach(it => { dispatchLog.push(Object.assign({code, name: ship.name, batch: '(找不到)', warning: '找不到編號'}, it)); });
      warnings.push(`找不到編號：${code}（${ship.items.map(i => i.store).join('、')}）`);
      continue;
    }
    batches.sort((a, b) => a.row - b.row);
    const appliedMap = inPlace ? buildAppliedMovementMap(batches) : {};

    for (const item of ship.items) {
      if (code === 'X0000') {
        dispatchLog.push(Object.assign({code, name: ship.name, batch: '(指定不扣帳)', warning: ''}, item));
        continue;
      }

      const alreadyQty = inPlace ? consumeAppliedMovementQty(appliedMap, item) : 0;
      if (alreadyQty >= item.qty) {
        dispatchLog.push(Object.assign({code, name: ship.name, batch: '(今日欄位已有備註，跳過)', warning: ''}, item));
        continue;
      }
      const workItem = alreadyQty > 0 ? Object.assign({}, item, {qty: item.qty - alreadyQty, originalQty: item.qty}) : item;

      if (workItem.swap) {
        const target = findPreferredNoteBatch(batches, workItem);
        if (target) {
          if (!target.taken) target.taken = [];
          target.taken.push({type: 'swap', store: workItem.store, qty: workItem.qty, unit: workItem.unit});
        }
        dispatchLog.push(Object.assign({code, name: ship.name, batch: '(換貨抵銷)', warning: ''}, workItem));
        continue;
      }
      if (workItem.return) {
        const target = findPreferredStockedBatch(batches, workItem);
        if (target) {
          target.newQty += workItem.qty;
          if (!target.taken) target.taken = [];
          target.taken.push({type: 'return', store: workItem.store, qty: workItem.qty, unit: workItem.unit});
        }
        dispatchLog.push(Object.assign({code, name: ship.name, batch: '(退回入庫)', warning: ''}, workItem));
        continue;
      }
      let qtyLeft = workItem.qty;
      let isFirstSlice = true;
      const usedBatches = [];
      for (const b of orderBatchesForShipmentItem(batches, workItem)) {
        if (qtyLeft <= 0) break;
        if (b.newQty <= 0) continue;
        const take = Math.min(qtyLeft, b.newQty);
        b.newQty -= take;
        qtyLeft -= take;

        if (!b.taken) b.taken = [];
        b.taken.push({
          type: 'deduct', store: workItem.store, qty: take, unit: workItem.unit,
          orderQty: workItem.qty, showTotal: isFirstSlice && workItem.qty > take,
        });

        usedBatches.push(`${formatExpiry(b.expiry)}(-${take})`);
        isFirstSlice = false;
      }
      dispatchLog.push(Object.assign({
        code, name: ship.name, batch: usedBatches.join(' '), warning: qtyLeft > 0 ? `庫存不足，缺 ${qtyLeft} ${workItem.unit}` : '',
      }, workItem));
      if (qtyLeft > 0) warnings.push(`${code} ${ship.name}｜${workItem.store}：缺 ${qtyLeft} ${workItem.unit}`);
    }
  }

  if (dryRun) { showPreview(dispatchLog, warnings, today); return; }

  if (!silent) {
    const title = inPlace ? `接續扣帳 ${today}` : `確定扣帳 ${today}？`;
    const body  = inPlace ? `將「在現有 ${today} 欄位上」繼續扣 ${dispatchLog.length} 筆出貨\n\n警告：${warnings.length} 個`
                          : `將插入新欄「${today}」\n\n扣帳：${dispatchLog.length} 筆\n警告：${warnings.length} 個`;
    if (ui.alert(title, body, ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  }

  const headerDate = new Date(targetDate.getTime());
  sheetCtx.forEach((ctx, sIdx) => {
    const nCols = ctx.config.cols;
    const emptyRow = nCols === 2 ? ['', ''] : [''];
    const headerRow = nCols === 2 ? [headerDate, headerDate] : [headerDate];

    let newLeft1idx;
    if (inPlace || recompute) {
      newLeft1idx = ctx.todayLeftCol + 1;
    } else {
      // 新扣帳一定插入全新日期欄，不複製隔壁欄位，避免舊備註被帶到新欄。
      ctx.sheet.insertColumnsAfter(ctx.prevRightCol + 1, nCols);
      newLeft1idx = ctx.prevRightCol + 2;
      ctx.sheet.getRange(1, newLeft1idx, ctx.data.length, nCols).clearNote();
      ctx.sheet.getRange(1, newLeft1idx, 1, nCols).setValues([headerRow]).setNumberFormat('M月d日').setFontWeight('bold');
    }

    const updates = [];
    const notes = [];
    for (let r = 1; r < ctx.data.length; r++) {
      const code = String(ctx.data[r][ctx.cols.code]).trim();
      const prevQtyCell = ctx.data[r][ctx.prevLeftCol];
      const prevBoxCell = nCols === 2 ? ctx.data[r][ctx.prevRightCol] : '';

      if (!code || !skuBatches[code]) { updates.push(emptyRow.slice()); notes.push([null]); continue; }
      const batch = skuBatches[code].find(b => b.sheetIdx === sIdx && b.row === r);
      if (!batch) { updates.push(emptyRow.slice()); notes.push([null]); continue; }

      const newQty = batch.newQty;
      if (newQty === batch.prevQty) {
        updates.push(nCols === 2 ? [prevQtyCell, prevBoxCell] : [prevQtyCell]);
      } else {
        const qtyOut = isBlankCell(prevQtyCell) && newQty === 0 ? '' : newQty;
        if (nCols === 2) {
          const unit = String(ctx.data[r][ctx.cols.unit]).trim();
          const boxSize = getBoxSize(String(ctx.data[r][ctx.cols.name]), batch.prevQty, batch.prevBox);
          const prevBoxStyle = detectBoxStyle(prevBoxCell);
          const boxStr = formatBoxBreakdown(newQty, boxSize, unit, prevBoxStyle);
          const boxOut = isBlankCell(prevBoxCell) ? '' : boxStr;
          updates.push([qtyOut, boxOut]);
        } else {
          updates.push([qtyOut]);
        }
      }

      const taken = (batch.taken || []);
      if (taken.length > 0) notes.push([formatTakenNote(taken)]);
      else notes.push([null]);
    }
    ctx.sheet.getRange(2, newLeft1idx, updates.length, nCols).setValues(updates);

    const noteRange = ctx.sheet.getRange(2, newLeft1idx, notes.length, 1);
    const existingNotes = noteRange.getNotes();
    const mergedNotes = notes.map((n, i) => [mergeNote(existingNotes[i][0], n[0])]);
    noteRange.setNotes(mergedNotes);

    const warnRows = new Set();
    for (const d of dispatchLog) {
      if (!d.warning) continue;
      const bs = skuBatches[d.code];
      if (bs) bs.filter(b => b.sheetIdx === sIdx).forEach(b => warnRows.add(b.row));
    }
    warnRows.forEach(r => ctx.sheet.getRange(r + 1, newLeft1idx, 1, nCols).setBackground('#fee2e2'));
  });

  const reportSheetName = writeReport(ss, today, dispatchLog, warnings, targetDate);
  const inventoryAlerts = silent ? null : writeInventoryAlerts(ss, today, targetDate);

  if (silent) return {deductions: dispatchLog.length, warnings: warnings.length};
  const alertText = inventoryAlerts
    ? `\n\n快過期：${inventoryAlerts.expiryCount} 筆｜低庫存：${inventoryAlerts.lowCount} 筆\n詳細提醒見「${inventoryAlerts.sheetName}」分頁。`
    : '';
  ui.alert('✅ 完成！', `扣帳 ${dispatchLog.length} 筆，警告 ${warnings.length} 個。\n對帳記錄見「${reportSheetName}」分頁。${alertText}`, ui.ButtonSet.OK);
}

// ─────────── 報表 ───────────

function writeReport(ss, today, log, warnings, targetDate) {
  targetDate = targetDate || new Date();
  const name = getWeeklyReportSheetName('對帳', targetDate);
  const sheet = getOrCreateReportSheet(ss, name);
  const header = ['編號', '品名', '店家', '出貨量', '單位', '扣帳批次', '原始記錄', '備註'];
  const blockLabel = `【${today} 對帳】`;
  let startRow = beginReportDateBlock(sheet, blockLabel, header.length);

  if (warnings.length > 0) {
    sheet.getRange(startRow, 1).setValue('⚠️ 警告彙整').setFontWeight('bold').setBackground('#fee2e2');
    const warnRows = warnings.map(w => [w]);
    sheet.getRange(startRow + 1, 1, warnRows.length, 1).setValues(warnRows);
    startRow += warnRows.length + 2;
  }

  sheet.getRange(startRow, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#e5e7eb');

  if (log.length) {
    const blockColors = ['#eff6ff', '#fdf2f8', '#ecfdf5', '#fefce8', '#faf5ff', '#fff7ed'];
    const rows = [];
    const colorMap = [];
    let colorIdx = -1;
    let lastCode = null;
    for (const d of log) {
      if (d.code !== lastCode) {
        if (lastCode !== null) { rows.push(Array(header.length).fill('')); colorMap.push(null); }
        colorIdx = (colorIdx + 1) % blockColors.length;
        lastCode = d.code;
      }
      rows.push([
        d.code || '', d.name || '', d.store || '', d.qty || 0, d.unit || '',
        d.batch || '', d.raw || '', d.warning || (d.swap ? '換貨抵銷' : d.return ? '退回入庫' : ''),
      ]);
      colorMap.push(d.warning ? '#fee2e2' : blockColors[colorIdx]);
    }
    sheet.getRange(startRow + 1, 1, rows.length, header.length).setValues(rows);
    for (let i = 0; i < colorMap.length; i++) {
      if (colorMap[i]) sheet.getRange(startRow + 1 + i, 1, 1, header.length).setBackground(colorMap[i]);
    }
  }

  sheet.autoResizeColumns(1, header.length);
  arrangeCoreSheetsFirst(ss);
  return name;
}

// ─────────── 快過期 / 低庫存提醒 ───────────

function writeInventoryAlerts(ss, today, targetDate) {
  const rows = [];
  const frequentShipments = buildFrequentShipmentCodeMap(ss, targetDate);
  for (const cfg of STOCK_SHEETS) {
    const stockSheet = getSheetByLogicalName(ss, cfg.name);
    if (!stockSheet) continue;
    const ctx = buildVerifyContext(stockSheet, cfg, targetDate);
    if (ctx.error) continue;

    for (let r = 1; r < ctx.data.length; r++) {
      const code = String(ctx.data[r][ctx.cols.code] || '').trim();
      if (!code) continue;

      const qtyRaw = ctx.data[r][ctx.todayLeftCol];
      if (isBlankCell(qtyRaw)) continue;
      const qty = parseInt(qtyRaw, 10) || 0;
      const unit = ctx.cols.unit !== undefined ? String(ctx.data[r][ctx.cols.unit] || '').trim() : '';
      const name = ctx.cols.name !== undefined ? String(ctx.data[r][ctx.cols.name] || '').trim() : '';
      const expiry = ctx.data[r][ctx.cols.expiry];
      const expiryDate = parseAlertExpiryDate(expiry);

      if (expiryDate && qty > 0) {
        const days = Math.floor((expiryDate.getTime() - targetDate.getTime()) / 86400000);
        if (days <= EXPIRY_ALERT_DAYS) {
          rows.push(['快過期', cfg.name, r + 1, code, name, formatAlertExpiry(expiry), qty, unit, formatExpiryAlertText(days)]);
        }
      }

      const shipCount = frequentShipments[code] || 0;
      if (qty <= LOW_STOCK_ALERT_QTY && shipCount >= LOW_STOCK_MIN_SHIPMENT_COUNT) {
        rows.push(['低庫存', cfg.name, r + 1, code, name, formatAlertExpiry(expiry), qty, unit, `最近 ${LOW_STOCK_SHIPMENT_LOOKBACK_DAYS} 天出貨 ${shipCount} 次，庫存 ${qty}${unit || ''}，小於等於 ${LOW_STOCK_ALERT_QTY}`]);
      }
    }
  }

  const sheetName = getWeeklyReportSheetName('提醒', targetDate);
  const sheet = getOrCreateReportSheet(ss, sheetName);
  const header = ['類型', '庫存分頁', '列號', '編號', '品名', '到期日', '今日庫存', '單位', '說明'];
  const blockLabel = `【${today} 提醒】`;
  let startRow = beginReportDateBlock(sheet, blockLabel, header.length);
  sheet.getRange(startRow, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#e5e7eb');

  if (rows.length) {
    sheet.getRange(startRow + 1, 1, rows.length, header.length).setValues(rows);
    for (let i = 0; i < rows.length; i++) {
      const bg = rows[i][0] === '快過期' ? '#ffedd5' : '#fef9c3';
      sheet.getRange(startRow + 1 + i, 1, 1, header.length).setBackground(bg);
    }
  } else {
    sheet.getRange(startRow + 1, 1).setValue('沒有快過期或低庫存提醒');
  }

  sheet.autoResizeColumns(1, header.length);
  arrangeCoreSheetsFirst(ss);
  return {
    sheetName,
    expiryCount: rows.filter(r => r[0] === '快過期').length,
    lowCount: rows.filter(r => r[0] === '低庫存').length,
  };
}

function buildFrequentShipmentCodeMap(ss, targetDate) {
  const map = {};
  const from = new Date(targetDate.getTime());
  from.setDate(from.getDate() - LOW_STOCK_SHIPMENT_LOOKBACK_DAYS + 1);
  from.setHours(0, 0, 0, 0);

  for (const sheet of ss.getSheets()) {
    const shipDate = parseShipmentSheetDate(sheet.getName());
    if (!shipDate || shipDate < from || shipDate > targetDate) continue;
    const shipments = parseShipments(sheet.getDataRange().getValues());
    for (const code of Object.keys(shipments)) {
      if (code === 'X0000') continue;
      let count = 0;
      for (const item of shipments[code].items || []) {
        if (item.swap || item.return) continue;
        count++;
      }
      if (count > 0) map[code] = (map[code] || 0) + count;
    }
  }
  return map;
}

function parseAlertExpiryDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) {
    const d = new Date(v.getFullYear(), v.getMonth(), v.getDate());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (typeof v === 'number' && v > 20000) {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  const s = String(v || '').trim();
  if (!s || s === '//' || /無保存期限|沒效期/.test(s)) return null;
  const m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!m) return null;
  const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatAlertExpiry(v) {
  const d = parseAlertExpiryDate(v);
  if (d) return Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy/M/d');
  return String(v || '').trim();
}

function formatExpiryAlertText(days) {
  if (days < 0) return `已過期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天到期';
  return `${days} 天後到期`;
}

// ─────────── 解析備註 ───────────

function extractManualPortion(noteText) {
  if (!noteText) return '';
  const sIdx = noteText.indexOf(NOTE_AUTO_START);
  if (sIdx < 0) return noteText;
  const before = noteText.substring(0, sIdx);
  const tail = noteText.substring(sIdx + NOTE_AUTO_START.length);
  const eIdx = tail.indexOf(NOTE_AUTO_END);
  const after = eIdx >= 0 ? tail.substring(eIdx + NOTE_AUTO_END.length) : '';
  return before + after;
}

function splitNoteSections(noteText) {
  const text = String(noteText || '');
  if (!text) return [];

  const sections = [];
  let pos = 0;
  while (pos < text.length) {
    const sIdx = text.indexOf(NOTE_AUTO_START, pos);
    if (sIdx < 0) {
      if (text.substring(pos).trim()) sections.push({source: 'manual', text: text.substring(pos)});
      break;
    }
    if (sIdx > pos && text.substring(pos, sIdx).trim()) {
      sections.push({source: 'manual', text: text.substring(pos, sIdx)});
    }

    const bodyStart = sIdx + NOTE_AUTO_START.length;
    const eIdx = text.indexOf(NOTE_AUTO_END, bodyStart);
    if (eIdx < 0) {
      if (text.substring(bodyStart).trim()) sections.push({source: 'auto', text: text.substring(bodyStart)});
      break;
    }

    if (text.substring(bodyStart, eIdx).trim()) {
      sections.push({source: 'auto', text: text.substring(bodyStart, eIdx)});
    }
    pos = eIdx + NOTE_AUTO_END.length;
  }
  return sections;
}

function parseDeductionNoteLine(line, source) {
  const t = normalizeSigns(String(line || '').trim());
  if (!t) return null;

  const swapPat = /^(.+?)[:：\s\-]*\+\s*(\d{1,6})\s*-\s*\d{1,6}\s*(包|箱|罐|桶|條|盒|片|瓶|組|散裝|顆|支|袋)?\s*(?:\([^)]*換貨[^)]*\)|（[^）]*換貨[^）]*）)\s*$/;
  const sm = t.match(swapPat);
  if (sm) {
    const store = sm[1].trim();
    if (!isValidStoreText(store)) return null;
    const qty = parseInt(sm[2], 10);
    if (!qty || isNaN(qty)) return null;
    return {store, qty, isAdd: false, isReturn: false, isSwap: true, unit: sm[3] || '', raw: t, source};
  }

  const pat = /^(.+?)[:：\s\-]*([+\-])?\s*(\d{1,6})\s*(包|箱|罐|桶|條|盒|片|瓶|組|散裝|顆|支|袋)?\s*(?:\([^)]*\)|（[^）]*）)?\s*$/;
  const m = t.match(pat);
  if (!m) return null;

  const store = m[1].trim();
  if (!isValidStoreText(store)) return null;

  const qty = parseInt(m[3], 10);
  if (!qty || isNaN(qty)) return null;

  const isReturnNote = /退回|退貨/.test(t);
  const isSwapNote = /換貨|交換/.test(t);
  const isAdd = isReturnNote || (!isSwapNote && m[2] === '+');
  return {store, qty, isAdd, isReturn: isReturnNote, isSwap: isSwapNote, unit: m[4] || '', raw: t, source};
}

function extractNoteDeductions(noteText, shipMovements) {
  const out = [];
  const shipmentKeys = buildMovementKeySet(shipMovements || []);

  for (const section of splitNoteSections(noteText)) {
    const lines = section.text.split(/[\n;；,，]/);
    for (const line of lines) {
      const item = parseDeductionNoteLine(line, section.source);
      if (!item) continue;

      if (item.isSwap) {
        item.coveredByShipment = true;
        item.appliesToStock = false;
        out.push(item);
        continue;
      }

      item.coveredByShipment = item.source === 'auto' || shipmentKeys.has(movementKey(item)) || shipmentKeys.has(movementKey(Object.assign({}, item, {unit: ''})));
      item.appliesToStock = item.source !== 'auto' && !item.coveredByShipment;
      out.push(item);
    }
  }
  return out;
}

function extractManualDeductions(noteText, shipMovements) {
  return extractNoteDeductions(noteText, shipMovements).filter(d => d.appliesToStock);
}

// ─────────── 除錯：跨日期核對備註、庫存與出貨 ───────────

function runDebugInventoryAudit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const allDates = collectStockAuditDates(ss);
  if (allDates.length === 0) {
    return ui.alert('找不到庫存日期欄', '目前沒有可供除錯檢查的庫存日期欄。', ui.ButtonSet.OK);
  }

  const firstLabel = Utilities.formatDate(allDates[0], tz, 'yyyy/M/d');
  const lastLabel = Utilities.formatDate(allDates[allDates.length - 1], tz, 'yyyy/M/d');
  const dateResp = ui.prompt(
    '🧪 除錯檢查起始日',
    `輸入要從哪一天開始檢查（M/D 或 YYYY/M/D）。\n空白 = 從最前面的 ${firstLabel} 開始。\n目前最後日期：${lastLabel}`,
    ui.ButtonSet.OK_CANCEL
  );
  if (dateResp.getSelectedButton() !== ui.Button.OK) return;

  const dateInput = String(dateResp.getResponseText() || '').trim();
  const startDate = dateInput ? parseFlexibleReportDate(dateInput) : allDates[0];
  if (!startDate) {
    return ui.alert('日期格式錯誤', '請輸入例如 6/4 或 2026/6/4。', ui.ButtonSet.OK);
  }

  const selectedDates = allDates.filter(date => date.getTime() >= startDate.getTime());
  if (selectedDates.length === 0) {
    return ui.alert('沒有可檢查日期', `找不到 ${dateInput} 之後的庫存日期欄。`, ui.ButtonSet.OK);
  }

  let codeFilter = '';
  const codeChoice = ui.alert(
    '是否指定商品編號？',
    '選「是」只檢查一個商品編號；選「否」檢查全部商品。',
    ui.ButtonSet.YES_NO_CANCEL
  );
  if (codeChoice === ui.Button.CANCEL) return;
  if (codeChoice === ui.Button.YES) {
    const codeResp = ui.prompt(
      '輸入商品編號',
      '請輸入完整商品編號，例如 1A001。',
      ui.ButtonSet.OK_CANCEL
    );
    if (codeResp.getSelectedButton() !== ui.Button.OK) return;
    codeFilter = normalizeStockCodeInput(codeResp.getResponseText());
    if (!codeFilter) {
      return ui.alert('沒有輸入商品編號', '若要檢查全部，請重新執行並在上一題選「否」。', ui.ButtonSet.OK);
    }
  }

  clearDebugInventoryHighlights(ss);
  const result = auditInventoryDates(ss, selectedDates, codeFilter);
  applyDebugInventoryHighlights(ss, result);
  const reportName = writeDebugInventoryReport(ss, result, startDate, codeFilter);

  const missingShipmentText = result.missingShipmentDates.length
    ? `\n找不到出貨分頁：${result.missingShipmentDates.join('、')}`
    : '';
  const baselineText = result.baselineDates.length
    ? `\n基準日無前一日可比：${result.baselineDates.join('、')}`
    : '';
  ui.alert(
    '除錯檢查完成',
    `檢查日期 ${result.auditedDates.length} 天、庫存列 ${result.checkedRows} 筆。\n發現問題 ${result.issues.length} 筆。\n紅色：備註與庫存數字不一致。\n黃色：商品合計與出貨分頁不一致。${missingShipmentText}${baselineText}\n\n詳細結果見「${reportName}」分頁。`,
    ui.ButtonSet.OK
  );
}

function collectStockAuditDates(ss) {
  const found = {};
  for (const source of getDebugStockSheetSources(ss)) {
    const sheet = source.sheet;
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    const cols = detectStockColumns(headers);
    if (cols.expiry === undefined) continue;

    for (let c = cols.expiry + 1; c < headers.length; c++) {
      if (!isDateHeader(headers[c])) continue;
      const date = normalizeDebugDate(parseDateHeader(headers[c]));
      if (!date) continue;
      found[debugDateKey(date)] = date;
    }
  }
  return Object.keys(found).map(key => found[key]).sort((a, b) => a - b);
}

function getDebugStockSheetSources(ss) {
  const sources = [];
  const seenSheetIds = {};

  for (const cfg of STOCK_SHEETS) {
    const sheet = getSheetByLogicalName(ss, cfg.name);
    if (!sheet || seenSheetIds[sheet.getSheetId()]) continue;
    seenSheetIds[sheet.getSheetId()] = true;
    sources.push({cfg, sheet});
  }

  for (const sheet of ss.getSheets()) {
    if (!isDebugStockCopySheetName(sheet.getName()) || seenSheetIds[sheet.getSheetId()]) continue;
    seenSheetIds[sheet.getSheetId()] = true;
    sources.push({
      cfg: {name: stripPinnedSheetPrefix(sheet.getName()), cols: 2, debugOnly: true},
      sheet,
    });
  }
  return sources;
}

function isDebugStockCopySheetName(name) {
  const compact = stripPinnedSheetPrefix(name).replace(/\s+/g, '');
  return compact === '測試副本' ||
    compact === '「測試副本」的副本' ||
    compact === '測試副本的副本';
}

function normalizeDebugDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  const out = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  out.setHours(0, 0, 0, 0);
  return out;
}

function debugDateKey(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy-MM-dd');
}

function buildDebugDateContext(sheet, cfg, targetDate, cachedData) {
  const data = cachedData || sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const cols = detectStockColumns(headers);
  if (cols.code === undefined || cols.name === undefined || cols.expiry === undefined) {
    return {error: '欄位偵測失敗'};
  }

  let todayRightCol = -1;
  for (let c = headers.length - 1; c > cols.expiry; c--) {
    if (isSameDate(headers[c], targetDate)) {
      todayRightCol = c;
      break;
    }
  }
  if (todayRightCol < 0) return {error: '沒有該日欄位'};

  const todayLeftCol = todayRightCol > cols.expiry &&
    sameDateHeader(headers[todayRightCol], headers[todayRightCol - 1])
    ? todayRightCol - 1
    : todayRightCol;

  let previousRightCol = -1;
  for (let c = todayLeftCol - 1; c > cols.expiry; c--) {
    if (isDateHeader(headers[c]) && !isSameDate(headers[c], targetDate)) {
      previousRightCol = c;
      break;
    }
  }
  if (previousRightCol < 0) {
    return {baseline: true, sheet, data, headers, cols, config: cfg, todayLeftCol, todayRightCol};
  }

  const previousLeftCol = previousRightCol > cols.expiry &&
    sameDateHeader(headers[previousRightCol], headers[previousRightCol - 1])
    ? previousRightCol - 1
    : previousRightCol;

  return {
    sheet,
    data,
    headers,
    cols,
    config: cfg,
    todayLeftCol,
    todayRightCol,
    previousLeftCol,
    previousRightCol,
  };
}

function auditInventoryDates(ss, dates, codeFilter) {
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const stockSources = getDebugStockSheetSources(ss).map(source => ({
    cfg: source.cfg,
    sheet: source.sheet,
    data: source.sheet.getDataRange().getValues(),
  }));
  const result = {
    issues: [],
    checkedRows: 0,
    auditedDates: [],
    baselineDates: [],
    missingShipmentDates: [],
    errorRefs: [],
    warningRefs: [],
  };

  for (const targetDate of dates) {
    const dateLabel = Utilities.formatDate(targetDate, tz, 'M/d');
    const contexts = [];
    let hasBaseline = false;

    for (const source of stockSources) {
      const ctx = buildDebugDateContext(source.sheet, source.cfg, targetDate, source.data);
      if (ctx.baseline) {
        hasBaseline = true;
        continue;
      }
      if (!ctx.error) contexts.push(ctx);
    }

    if (contexts.length === 0) {
      if (hasBaseline && result.baselineDates.indexOf(dateLabel) < 0) result.baselineDates.push(dateLabel);
      continue;
    }
    result.auditedDates.push(dateLabel);

    const shipSheet = findShipmentSheet(ss, targetDate);
    const shipments = shipSheet ? parseShipments(shipSheet.getDataRange().getValues()) : {};
    const shipMovementMap = buildShipMovementMap(shipments);
    if (!shipSheet) result.missingShipmentDates.push(dateLabel);

    const groups = {};
    for (const ctx of contexts) {
      const notes = ctx.data.length > 1
        ? ctx.sheet.getRange(2, ctx.todayLeftCol + 1, ctx.data.length - 1, 1).getNotes()
        : [];

      for (let r = 1; r < ctx.data.length; r++) {
        const code = normalizeStockCodeInput(ctx.data[r][ctx.cols.code]);
        if (!code || (codeFilter && code !== codeFilter)) continue;

        const noteText = notes[r - 1] ? notes[r - 1][0] : '';
        const previousQty = parseDebugQuantity(ctx.data[r][ctx.previousLeftCol]);
        const currentQty = parseDebugQuantity(ctx.data[r][ctx.todayLeftCol]);
        const shipMovements = getShipMovementsForCode(shipMovementMap, code);
        if (isBlankCell(ctx.data[r][ctx.previousLeftCol]) &&
            isBlankCell(ctx.data[r][ctx.todayLeftCol]) &&
            !String(noteText || '').trim() &&
            shipMovements.length === 0) continue;

        const noteInfo = analyzeDebugStockNote(noteText, shipMovements);
        const record = {
          date: targetDate,
          dateLabel,
          sheet: ctx.sheet,
          sheetName: ctx.sheet.getName(),
          sheetId: ctx.sheet.getSheetId(),
          row: r + 1,
          cellA1: colLetter(ctx.todayLeftCol) + (r + 1),
          code,
          name: String(ctx.data[r][ctx.cols.name] || '').trim(),
          expiry: formatAlertExpiry(ctx.data[r][ctx.cols.expiry]),
          previousQty,
          currentQty,
          actualDelta: currentQty - previousQty,
          noteText: String(noteText || '').replace(NOTE_INVISIBLE_RE, '').trim(),
          noteInfo,
        };

        if (!groups[code]) {
          groups[code] = {
            code,
            records: [],
            previousTotal: 0,
            currentTotal: 0,
            actualDelta: 0,
            noteDelta: 0,
            manualExtraDelta: 0,
            duplicateCount: 0,
            autoCount: 0,
          };
        }
        const group = groups[code];
        group.records.push(record);
        group.previousTotal += previousQty;
        group.currentTotal += currentQty;
        group.actualDelta += record.actualDelta;
        group.noteDelta += noteInfo.noteDelta;
        group.manualExtraDelta += noteInfo.manualExtraDelta;
        group.duplicateCount += noteInfo.duplicateCount;
        group.autoCount += noteInfo.autoCount;
        result.checkedRows++;
      }
    }

    const shipmentInfo = buildDebugShipmentDeltaMap(groups, shipments, codeFilter);
    for (const missing of shipmentInfo.missing) {
      result.issues.push({
        severity: 'warning',
        dateLabel,
        type: '出貨編號找不到庫存',
        sheetName: '(找不到)',
        row: '',
        code: missing.code,
        name: missing.name,
        expiry: '',
        previousQty: '',
        currentQty: '',
        actualDelta: '',
        noteDelta: '',
        expectedDelta: missing.delta,
        noteText: missing.raw,
        reason: '出貨分頁有此編號，但庫存分頁找不到完全相同或可唯一對應的編號。可能是編號打錯、庫存尚未建檔，或尾碼不一致。',
        sheetId: null,
        cellA1: '',
      });
    }

    for (const code of Object.keys(groups)) {
      const group = groups[code];
      const shipDelta = shipmentInfo.deltaMap[code] || 0;
      group.expectedDelta = shipSheet ? shipDelta + group.manualExtraDelta : null;

      for (const record of group.records) {
        if (record.actualDelta === record.noteInfo.noteDelta) continue;
        result.issues.push(makeDebugRowIssue(record, group, !!shipSheet));
        result.errorRefs.push({sheetId: record.sheetId, a1: record.cellA1});
      }

      if (shipSheet && group.actualDelta !== group.expectedDelta) {
        const first = group.records[0];
        result.issues.push(makeDebugGroupIssue(first, group, shipDelta));
        for (const record of group.records) {
          result.warningRefs.push({sheetId: record.sheetId, a1: record.cellA1});
        }
      }
    }
  }
  if (codeFilter && result.checkedRows === 0) {
    result.issues.push({
      severity: 'warning',
      dateLabel: dates.length ? Utilities.formatDate(dates[0], tz, 'M/d') : '',
      type: '指定編號找不到可檢查庫存',
      sheetName: '(找不到)',
      row: '',
      code: codeFilter,
      name: '',
      expiry: '',
      previousQty: '',
      currentQty: '',
      actualDelta: '',
      noteDelta: '',
      expectedDelta: '',
      noteText: '',
      reason: '在指定日期範圍內找不到此商品編號的庫存數字、備註或出貨紀錄。請確認編號、尾碼及日期範圍。',
      sheetId: null,
      cellA1: '',
    });
  }
  return result;
}

function parseDebugQuantity(value) {
  if (isBlankCell(value)) return 0;
  if (typeof value === 'number') return value;
  const text = String(value || '').replace(/,/g, '').trim();
  const match = text.match(/[+\-]?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

function analyzeDebugStockNote(noteText, shipMovements) {
  const items = extractNoteDeductions(noteText, shipMovements);
  const unrecognizedLines = [];
  const seen = {};
  let duplicateCount = 0;

  for (const section of splitNoteSections(noteText)) {
    for (const rawLine of section.text.split(/[\n;；,，]/)) {
      const line = String(rawLine || '').replace(NOTE_INVISIBLE_RE, '').trim();
      if (!line) continue;
      const item = parseDeductionNoteLine(line, section.source);
      if (!item) {
        unrecognizedLines.push(line);
        continue;
      }
      if (item.isSwap) continue;
      const key = movementKey(item);
      seen[key] = (seen[key] || 0) + 1;
      if (seen[key] > 1) duplicateCount++;
    }
  }

  let noteDelta = 0;
  let manualExtraDelta = 0;
  let autoCount = 0;
  for (const item of items) {
    if (item.source === 'auto') autoCount++;
    if (item.isSwap) continue;
    const delta = item.isAdd ? item.qty : -item.qty;
    noteDelta += delta;
    if (item.appliesToStock) manualExtraDelta += delta;
  }

  return {
    items,
    noteDelta,
    manualExtraDelta,
    autoCount,
    duplicateCount,
    unrecognizedLines,
  };
}

function buildDebugShipmentDeltaMap(groups, shipments, codeFilter) {
  const deltaMap = {};
  const missing = [];
  for (const shipCode of Object.keys(shipments)) {
    if (shipCode === 'X0000') continue;
    let targetCode = groups[shipCode] ? shipCode : findFuzzyCode(groups, shipCode);
    let delta = 0;
    const raw = [];
    for (const item of shipments[shipCode].items || []) {
      raw.push(item.raw || '');
      if (item.swap) continue;
      delta += item.return ? item.qty : -item.qty;
    }

    if (!targetCode) {
      if (!codeFilter || normalizeStockCodeInput(shipCode) === codeFilter) {
        missing.push({code: shipCode, name: shipments[shipCode].name || '', delta, raw: raw.join('\n')});
      }
      continue;
    }
    deltaMap[targetCode] = (deltaMap[targetCode] || 0) + delta;
  }
  return {deltaMap, missing};
}

function makeDebugRowIssue(record, group, hasShipmentSheet) {
  const reasons = [];
  if (!record.noteText) {
    reasons.push('庫存數字有變動，但當天儲存格沒有備註；可能是手動改過數量，或備註被清掉。');
  } else if (record.noteInfo.items.length === 0) {
    reasons.push('備註有文字，但沒有任何一行能解析成「名稱±數量」；可能是格式、符號或數字寫法不符合。');
  }
  if (record.noteInfo.unrecognizedLines.length) {
    reasons.push(`有無法識別的備註：${record.noteInfo.unrecognizedLines.slice(0, 3).join('、')}`);
  }
  if (record.noteInfo.duplicateCount > 0) {
    reasons.push('同一格出現相同方向與數量的重複備註，可能被寫入兩次。');
  }

  const difference = record.actualDelta - record.noteInfo.noteDelta;
  if (difference > 0) {
    reasons.push(`實際庫存比備註推算多 ${difference}，可能少扣、重複加回或備註多寫。`);
  } else if (difference < 0) {
    reasons.push(`實際庫存比備註推算少 ${Math.abs(difference)}，可能多扣、漏寫加回或備註少寫。`);
  }
  if (!hasShipmentSheet) {
    reasons.push('該日找不到出貨分頁，因此目前只能核對備註與庫存數字。');
  } else if (group.noteDelta === group.expectedDelta && group.actualDelta !== group.expectedDelta) {
    reasons.push('整個商品的出貨分頁與備註合計一致，較可能是庫存數字被手動改動或扣帳寫入中斷。');
  }

  return {
    severity: 'error',
    dateLabel: record.dateLabel,
    type: '備註與庫存不一致',
    sheetName: record.sheetName,
    row: record.row,
    code: record.code,
    name: record.name,
    expiry: record.expiry,
    previousQty: record.previousQty,
    currentQty: record.currentQty,
    actualDelta: record.actualDelta,
    noteDelta: record.noteInfo.noteDelta,
    expectedDelta: group.expectedDelta,
    noteText: record.noteText,
    reason: reasons.join('；'),
    sheetId: record.sheetId,
    cellA1: record.cellA1,
  };
}

function makeDebugGroupIssue(first, group, shipDelta) {
  const reasons = [];
  if (group.actualDelta === group.noteDelta && group.noteDelta !== group.expectedDelta) {
    reasons.push('庫存數字與備註彼此一致，但和出貨分頁不一致。可能是出貨分頁後來被修改、漏單、重複備註，或舊的系統備註仍留著。');
  } else if (group.noteDelta === group.expectedDelta && group.actualDelta !== group.expectedDelta) {
    reasons.push('出貨分頁與備註合計一致，但庫存數字不同。可能是庫存格被手動改過，或扣帳過程只寫入部分資料。');
  } else {
    reasons.push('出貨分頁、備註合計與庫存實際增減三者不一致，可能同時存在漏寫備註、重複扣帳或手動調整。');
  }
  if (group.autoCount > 0 && shipDelta === 0) {
    reasons.push('有系統自動備註，但出貨分頁沒有對應出貨，可能出貨資料已被刪除或修改。');
  }
  if (group.duplicateCount > 0) {
    reasons.push('偵測到重複備註，請優先確認是否重複執行過補貨或接續扣帳。');
  }

  const difference = group.actualDelta - group.expectedDelta;
  if (difference > 0) {
    reasons.push(`商品合計實際庫存比應有結果多 ${difference}。`);
  } else if (difference < 0) {
    reasons.push(`商品合計實際庫存比應有結果少 ${Math.abs(difference)}。`);
  }

  return {
    severity: 'warning',
    dateLabel: first.dateLabel,
    type: '商品合計與出貨不一致',
    sheetName: first.sheetName,
    row: '合計',
    code: first.code,
    name: first.name,
    expiry: `共 ${group.records.length} 列`,
    previousQty: group.previousTotal,
    currentQty: group.currentTotal,
    actualDelta: group.actualDelta,
    noteDelta: group.noteDelta,
    expectedDelta: group.expectedDelta,
    noteText: `出貨增減 ${shipDelta}；額外手動增減 ${group.manualExtraDelta}`,
    reason: reasons.join('；'),
    sheetId: first.sheetId,
    cellA1: first.cellA1,
  };
}

function getDebugQuantityColumns(headers, cols) {
  const out = [];
  for (let c = cols.expiry + 1; c < headers.length; c++) {
    if (!isDateHeader(headers[c])) continue;
    if (c > cols.expiry + 1 && sameDateHeader(headers[c], headers[c - 1])) continue;
    out.push(c);
  }
  return out;
}

function clearDebugInventoryHighlights(ss) {
  const colors = {};
  colors[DEBUG_ERROR_COLOR.toLowerCase()] = true;
  colors[DEBUG_WARNING_COLOR.toLowerCase()] = true;

  for (const source of getDebugStockSheetSources(ss)) {
    const sheet = source.sheet;
    if (!sheet || sheet.getLastRow() < 2) continue;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
    const cols = detectStockColumns(headers);
    if (cols.expiry === undefined) continue;

    const refs = [];
    const firstDateCol = cols.expiry + 1;
    const dateWidth = headers.length - firstDateCol;
    if (dateWidth <= 0) continue;
    const backgrounds = sheet.getRange(2, firstDateCol + 1, sheet.getLastRow() - 1, dateWidth).getBackgrounds();
    for (const col of getDebugQuantityColumns(headers, cols)) {
      const offset = col - firstDateCol;
      for (let i = 0; i < backgrounds.length; i++) {
        if (colors[String(backgrounds[i][offset] || '').toLowerCase()]) {
          refs.push(colLetter(col) + (i + 2));
        }
      }
    }
    setRangeListBackgroundInChunks(sheet, refs, null);
  }
}

function applyDebugInventoryHighlights(ss, result) {
  applyDebugHighlightRefs(ss, result.warningRefs, DEBUG_WARNING_COLOR);
  applyDebugHighlightRefs(ss, result.errorRefs, DEBUG_ERROR_COLOR);
}

function applyDebugHighlightRefs(ss, refs, color) {
  const grouped = {};
  for (const ref of refs || []) {
    if (!ref.sheetId || !ref.a1) continue;
    if (!grouped[ref.sheetId]) grouped[ref.sheetId] = {};
    grouped[ref.sheetId][ref.a1] = true;
  }

  for (const sheetId of Object.keys(grouped)) {
    const sheet = ss.getSheetById(parseInt(sheetId, 10));
    if (!sheet) continue;
    setRangeListBackgroundInChunks(sheet, Object.keys(grouped[sheetId]), color);
  }
}

function setRangeListBackgroundInChunks(sheet, refs, color) {
  const chunkSize = 500;
  for (let i = 0; i < refs.length; i += chunkSize) {
    sheet.getRangeList(refs.slice(i, i + chunkSize)).setBackground(color);
  }
}

function writeDebugInventoryReport(ss, result, startDate, codeFilter) {
  const name = '除錯結果';
  const old = ss.getSheetByName(name);
  if (old) ss.deleteSheet(old);
  const sheet = ss.insertSheet(name);
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const width = 15;

  sheet.getRange(1, 1, 1, width).merge()
    .setValue('庫存備註與數量除錯結果')
    .setBackground('#374151')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  const summary = [
    ['檢查起始日', Utilities.formatDate(startDate, tz, 'yyyy/M/d'), '商品篩選', codeFilter || '全部'],
    ['已檢查日期', result.auditedDates.join('、') || '無', '發現問題', result.issues.length],
    ['找不到出貨分頁', result.missingShipmentDates.join('、') || '無', '基準日', result.baselineDates.join('、') || '無'],
  ];
  sheet.getRange(2, 1, summary.length, 4).setValues(summary);
  sheet.getRange(2, 1, summary.length, 1).setFontWeight('bold');
  sheet.getRange(2, 3, summary.length, 1).setFontWeight('bold');

  const headerRow = 6;
  const header = [
    '日期', '問題類型', '庫存分頁', '列號', '編號', '品名', '到期日',
    '前日庫存', '當日庫存', '實際增減', '備註應增減', '出貨+手動應增減',
    '儲存格備註', '可能原因', '原表位置'
  ];
  sheet.getRange(headerRow, 1, 1, header.length)
    .setValues([header])
    .setFontWeight('bold')
    .setBackground('#e5e7eb');

  if (result.issues.length) {
    const rows = result.issues.map(issue => [
      issue.dateLabel,
      issue.type,
      issue.sheetName,
      issue.row,
      issue.code,
      issue.name,
      issue.expiry,
      issue.previousQty,
      issue.currentQty,
      issue.actualDelta,
      issue.noteDelta,
      issue.expectedDelta === null || issue.expectedDelta === undefined ? '' : issue.expectedDelta,
      issue.noteText,
      issue.reason,
      issue.sheetId && issue.cellA1
        ? `=HYPERLINK("#gid=${issue.sheetId}&range=${issue.cellA1}","前往原格")`
        : '',
    ]);
    sheet.getRange(headerRow + 1, 1, rows.length, header.length).setValues(rows);
    const backgrounds = result.issues.map(issue =>
      Array(header.length).fill(issue.severity === 'error' ? DEBUG_ERROR_COLOR : DEBUG_WARNING_COLOR)
    );
    sheet.getRange(headerRow + 1, 1, rows.length, header.length).setBackgrounds(backgrounds);
  } else {
    sheet.getRange(headerRow + 1, 1).setValue('沒有發現備註、庫存或出貨增減不一致。').setBackground('#dcfce7');
  }

  sheet.setFrozenRows(headerRow);
  sheet.autoResizeColumns(1, header.length);
  sheet.setColumnWidth(6, 220);
  sheet.setColumnWidth(13, 280);
  sheet.setColumnWidth(14, 520);
  sheet.getDataRange().setVerticalAlignment('top').setWrap(true);
  arrangeCoreSheetsFirst(ss);
  sheet.activate();
  return name;
}

// ─────────── 驗證功能群 ───────────

function runVerify() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const todayStr = Utilities.formatDate(new Date(), tz, 'M/d');

  const resp = ui.prompt('✅ 驗證已存在的扣帳', `輸入日期範圍 (如 5/20-5/22)\n空白 = 今天 (${todayStr})`, ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  let input = resp.getResponseText().trim();
  if (!input) input = todayStr;

  const range = parseDateRange(input);
  if (!range) return ui.alert('日期格式錯誤', '請用 M/D 格式', ui.ButtonSet.OK);
  const dates = datesInRange(range.start, range.end);

  const allDiffs = [];
  const dateSummary = [];

  for (const targetDate of dates) {
    const dateLabel = Utilities.formatDate(targetDate, tz, 'M/d');
    const result = verifyOneDate(ss, targetDate);
    if (result.error) {
      dateSummary.push(`${dateLabel}：⚠️ ${result.error}`);
      continue;
    }
    dateSummary.push(`${dateLabel}：${result.diffs.length} 處不一致`);
    for (const d of result.diffs) {
      d.targetDate = dateLabel;
      allDiffs.push(d);
    }
  }

  writeVerifyReport(ss, allDiffs);

  if (allDiffs.length === 0) {
    ui.alert('驗證完成', '🎉 完全正確！\n' + dateSummary.join('\n'), ui.ButtonSet.OK);
    return;
  }

  ui.alert(
    `驗證完成：發現 ${allDiffs.length} 處不一致`,
    `${dateSummary.join('\n')}\n\n詳見「驗證結果」分頁。\n您可以到該分頁確認建議備註，然後透過選單「🛠️ 幫我套用驗證表的建議備註並修正」一鍵補正！`,
    ui.ButtonSet.OK
  );
}

function verifyOneDate(ss, targetDate) {
  const dateLabel = Utilities.formatDate(targetDate, Session.getScriptTimeZone() || 'Asia/Taipei', 'M/d');

  // 使用者手動處理、不參與自動重算的編號（單日例外）。
  const SKIP_LIST = {
    '5/19': ['A0001'],
    '5/21': ['B0002'],
    '5/22': ['C0003', 'C0004']
  };

  const sheetCtx = [];
  for (const cfg of STOCK_SHEETS) {
    const sheet = getSheetByLogicalName(ss, cfg.name);
    if (!sheet) continue;
    const ctx = buildVerifyContext(sheet, cfg, targetDate);
    if (!ctx.error) sheetCtx.push(ctx);
  }
  if (sheetCtx.length === 0) return {error: '找不到該日庫存欄位'};
  const shipSheet = findShipmentSheet(ss, targetDate);
  if (!shipSheet) return {error: '找不到該日的出貨分頁'};

  const shipments = parseShipments(shipSheet.getDataRange().getValues());
  const shipMovementMap = buildShipMovementMap(shipments);
  const skuBatches = {};

  sheetCtx.forEach((ctx, sIdx) => {
    const allNotes = ctx.data.length > 1 ? ctx.sheet.getRange(2, ctx.todayLeftCol + 1, ctx.data.length - 1, 1).getNotes() : [];
    for (let r = 1; r < ctx.data.length; r++) {
      const code = String(ctx.data[r][ctx.cols.code]).trim();
      if (!code) continue;
      if (SKIP_LIST[dateLabel] && SKIP_LIST[dateLabel].includes(code)) continue;

      const prevQty = parseInt(ctx.data[r][ctx.yesterdayLeftCol], 10) || 0;
      const noteText = allNotes[r - 1] ? allNotes[r - 1][0] : '';
      const noteDeductions = extractNoteDeductions(noteText, getShipMovementsForCode(shipMovementMap, code));
      const manual = noteDeductions.filter(d => d.appliesToStock);
      let delta = 0;
      for (const d of manual) delta += d.isAdd ? d.qty : -d.qty;
      if (!skuBatches[code]) skuBatches[code] = [];
      skuBatches[code].push({
        sheetIdx: sIdx, row: r, expiry: ctx.data[r][ctx.cols.expiry],
        stockNote: ctx.cols.note !== undefined ? String(ctx.data[r][ctx.cols.note] || '').trim() : '',
        prevQty, newQty: prevQty + delta, manualDeductions: manual, noteDeductions, rawNote: noteText
      });
    }
  });

  for (const code of Object.keys(shipments)) {
    if (SKIP_LIST[dateLabel] && SKIP_LIST[dateLabel].includes(code)) continue;
    if (code === 'X0000') continue;

    const ship = shipments[code];
    let batches = skuBatches[code] || skuBatches[findFuzzyCode(skuBatches, code)];
    if (!batches) continue;
    batches.sort((a, b) => a.row - b.row);
    for (const item of ship.items) {
      if (item.swap) continue;
      if (item.return) {
        const last = findPreferredStockedBatch(batches, item);
        if (last) last.newQty += item.qty;
        continue;
      }
      let qtyLeft = item.qty;
      for (const b of orderBatchesForShipmentItem(batches, item)) {
        if (qtyLeft <= 0) break;
        if (b.newQty <= 0) continue;
        const take = Math.min(qtyLeft, b.newQty);
        b.newQty -= take; qtyLeft -= take;
      }
    }
  }

  const diffs = [];
  sheetCtx.forEach((ctx, sIdx) => {
    for (let r = 1; r < ctx.data.length; r++) {
      const code = String(ctx.data[r][ctx.cols.code]).trim();
      if (!code || !skuBatches[code]) continue;
      const batch = skuBatches[code].find(b => b.sheetIdx === sIdx && b.row === r);
      if (!batch) continue;

      const actualRaw = ctx.data[r][ctx.todayLeftCol];
      const actual = isBlankCell(actualRaw) ? 0 : (parseInt(actualRaw, 10) || 0);
      const expected = batch.newQty;

      if (actual !== expected) {
        const cleanNote = (batch.rawNote || '').replace(NOTE_INVISIBLE_RE, '').trim();
        const noteDeductions = batch.noteDeductions || [];
        const recognizedCount = noteDeductions.length;
        const appliedCount = noteDeductions.filter(d => d.appliesToStock).length;
        const coveredCount = noteDeductions.filter(d => d.coveredByShipment).length;
        const manualCount = noteDeductions.filter(d => d.source === 'manual').length;
        const autoCount = noteDeductions.filter(d => d.source === 'auto').length;
        const diff = expected - actual;

        let analysis = '';
        if (!cleanNote) analysis = '完全沒備註';
        else if (recognizedCount === 0) analysis = '有備註，但未識別到格式或數字';
        else if (appliedCount === 0 && autoCount > 0 && manualCount === 0) analysis = `已識別 ${recognizedCount} 筆系統自動備註；自動備註只做識別，不重複參與重算`;
        else if (appliedCount === 0 && coveredCount > 0) analysis = `已識別 ${recognizedCount} 筆備註（手動 ${manualCount}、系統 ${autoCount}），皆已涵蓋或為系統自動備註，未重複計算`;
        else if (coveredCount > 0) analysis = `已識別 ${recognizedCount} 筆備註（手動 ${manualCount}、系統 ${autoCount}），其中 ${coveredCount} 筆已涵蓋或為系統自動備註，其餘 ${appliedCount} 筆已納入重算`;
        else analysis = `已識別 ${recognizedCount} 筆備註（手動 ${manualCount}、系統 ${autoCount}），並已納入重算`;

        const rec = diff > 0 ? `補扣 -${diff}` : `補回 +${Math.abs(diff)}`;

        diffs.push({
          sheet: ctx.sheet.getName(), row: r + 1, code, name: String(ctx.data[r][ctx.cols.name]).trim(),
          expiry: formatExpiry(batch.expiry), prevQty: batch.prevQty, actual, expected, diff,
          msg: diff > 0 ? `多扣 ${diff}（實際剩比應該的少 ${diff}）` : `少扣 ${-diff}（實際剩比應該的多 ${-diff}，沒扣夠）`,
          fullCellNote: cleanNote, analysis, recommended: rec
        });
      }
    }
  });

  return {diffs};
}

function writeVerifyReport(ss, diffs) {
  const name = '驗證結果';
  let sheet = ss.getSheetByName(name);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(name);

  const header = ['驗證日', '庫存分頁', '列號', '編號', '品名', '到期日', '前日庫存', '應該剩', '實際剩', '差額', '說明', '儲存格備註', '問題分析', '建議備註'];
  sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#e5e7eb');

  if (diffs.length === 0) { sheet.getRange(2, 1).setValue('🎉 沒有差異'); return; }

  const rows = diffs.map(d => [
    d.targetDate, d.sheet, d.row, d.code, d.name, d.expiry, d.prevQty, d.expected, d.actual, d.diff,
    d.msg, d.fullCellNote, d.analysis, d.recommended
  ]);
  sheet.getRange(2, 1, rows.length, header.length).setValues(rows);

  for (let i = 0; i < diffs.length; i++) {
    const range = sheet.getRange(i + 2, 1, 1, header.length);
    if (diffs[i].diff > 0) range.setBackground('#fee2e2');
    else range.setBackground('#fef9c3');
  }
  sheet.autoResizeColumns(1, header.length);
  sheet.setFrozenRows(1);
  arrangeCoreSheetsFirst(ss);
}

// ─────────── 🛠️ 套用修正功能 ───────────

function runApplyFixes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const verifySheet = ss.getSheetByName('驗證結果');

  if (!verifySheet) {
    return ui.alert('找不到驗證表', '請先執行「✅ 驗證已存在的扣帳」', ui.ButtonSet.OK);
  }

  const data = verifySheet.getDataRange().getValues();
  const headers = data[0];
  const dateIdx = headers.indexOf('驗證日');
  const sheetIdx = headers.indexOf('庫存分頁');
  const rowIdx = headers.indexOf('列號');
  const recIdx = headers.indexOf('建議備註');

  if (dateIdx < 0 || recIdx < 0) {
    return ui.alert('格式不符', '驗證表缺少必要的欄位', ui.ButtonSet.OK);
  }

  const fixesByDate = {};
  let fixCount = 0;

  for (let r = 1; r < data.length; r++) {
    const rec = String(data[r][recIdx]).trim();
    if (!rec || rec === '-' || rec === '') continue;

    const date = String(data[r][dateIdx]);
    const sheetName = String(data[r][sheetIdx]);
    const row = parseInt(data[r][rowIdx], 10);
    if (!date || !sheetName || isNaN(row)) continue;

    if (!fixesByDate[date]) fixesByDate[date] = [];
    fixesByDate[date].push({sheetName, row, note: rec});
    fixCount++;
  }

  if (fixCount === 0) {
    return ui.alert('沒有需要修正的項目', '建議備註欄位皆為空', ui.ButtonSet.OK);
  }

  const ok = ui.alert('套用修正', `將套用 ${fixCount} 筆建議備註並重新計算。\n確定執行？`, ui.ButtonSet.OK_CANCEL);
  if (ok !== ui.Button.OK) return;

  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const yr = new Date().getFullYear();

  for (const dateStr of Object.keys(fixesByDate)) {
    const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!m) continue;
    const targetDate = new Date(yr, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
    targetDate.setHours(0, 0, 0, 0);

    for (const fix of fixesByDate[dateStr]) {
      const logicalSheetName = stripPinnedSheetPrefix(fix.sheetName);
      const sheet = getSheetByLogicalName(ss, logicalSheetName);
      if (!sheet) continue;
      const cfg = STOCK_SHEETS.find(s => s.name === logicalSheetName);
      if (!cfg) continue;
      const ctx = buildVerifyContext(sheet, cfg, targetDate);
      if (ctx.error || ctx.todayLeftCol === undefined) continue;

      const cell = sheet.getRange(fix.row, ctx.todayLeftCol + 1);
      const oldNote = cell.getNote() || '';
      if (oldNote.indexOf(fix.note) === -1) {
        cell.setNote(oldNote ? oldNote + '\n' + fix.note : fix.note);
      }
    }
  }

  const datesToRecompute = Object.keys(fixesByDate).map(dStr => {
    const m = dStr.match(/^(\d{1,2})\/(\d{1,2})$/);
    return m ? new Date(yr, parseInt(m[1], 10) - 1, parseInt(m[2], 10)) : null;
  }).filter(d => d);
  datesToRecompute.sort((a, b) => a - b);

  for (const d of datesToRecompute) {
    dispatch(false, {silent: true, recompute: true, targetDate: d});
  }

  ui.alert('✅ 修正完成', `已成功為 ${datesToRecompute.map(d => Utilities.formatDate(d, tz, 'M/d')).join(', ')} 套用備註並重算完成！`, ui.ButtonSet.OK);
}

// ─────────── 出貨解析 ───────────

function parseShipmentLine(text) {
  const raw = String(text || '').trim();
  const normalizedRaw = normalizeSigns(raw);
  if (!normalizedRaw) return null;

  for (const storeName of STORE_NAME_HINTS) {
    const re = new RegExp(
      '^' + escapeRegExp(storeName) + '\\s*([+\\-]?)\\s*(\\d+)\\s*(' + UNITS + ')\\s*(.*)$',
      'i'
    );
    const m = normalizedRaw.match(re);
    if (m) return makeShipmentItem(storeName, m[1] + m[2], m[3], m[4], raw);
  }

  const m = normalizedRaw.match(SHIPMENT_RE);
  if (!m) return null;
  const store = m[1].trim().replace(/^\s*[+\-]\s*/, '');
  return makeShipmentItem(store, m[2] + m[3], m[4], m[5], raw);
}

function makeShipmentItem(store, qtyRaw, unit, tail, raw) {
  const normalizedQtyRaw = normalizeSigns(qtyRaw);
  const qty = Math.abs(parseInt(normalizedQtyRaw, 10));
  const noteTail = String(tail || '').trim();
  const sign = normalizedQtyRaw.charAt(0);
  const hasReturnTag = /退回|退貨/.test(noteTail);
  const hasSwapTag = /換貨|交換/.test(noteTail);
  const isReturn = hasReturnTag || (sign === '+' && !hasSwapTag);
  const isSwap = !isReturn && hasSwapTag;
  return {store, qty, unit, swap: isSwap, return: isReturn, raw};
}

function parseShipments(rows) {
  const result = {};
  for (const row of rows) {
    const code = String(row[0] || '').trim();
    const name = String(row[1] || '').trim();
    const c2   = String(row[2] || '').trim();
    if (!code || !c2) continue;
    if (/^總計/.test(c2)) continue;
    if (/^請輸入/.test(c2)) continue;

    const item = parseShipmentLine(c2);
    if (!item) continue;

    if (!result[code]) result[code] = {name, items: []};
    result[code].items.push(item);
  }
  for (const code of Object.keys(result)) {
    result[code].items = normalizeSwapPairs(result[code].items);
  }
  return result;
}

function normalizeSwapPairs(items) {
  const out = [];
  for (const item of items || []) {
    if (item.swap && out.length > 0) {
      const prev = out[out.length - 1];
      if (isShipmentSwapPair(prev, item)) {
        out.pop();
        item.pairedDeduction = true;
      }
    }
    out.push(item);
  }
  return out;
}

function isShipmentSwapPair(prev, swapItem) {
  if (!prev || !swapItem) return false;
  if (prev.swap || prev.return || !swapItem.swap) return false;
  return normalizeStoreKey(prev.store) === normalizeStoreKey(swapItem.store) &&
    String(prev.unit || '').trim() === String(swapItem.unit || '').trim() &&
    prev.qty === swapItem.qty;
}

function normalizeSigns(s) {
  return String(s || '').replace(/＋/g, '+').replace(/[－−]/g, '-');
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function todayLabel() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Taipei', 'M月d日'); }

function shipmentSheetCandidatesFor(date) {
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  return [Utilities.formatDate(date, tz, 'M/d') + '出貨', Utilities.formatDate(date, tz, 'M月d日') + '出貨', Utilities.formatDate(date, tz, 'M-d') + '出貨', Utilities.formatDate(date, tz, 'MMdd') + '出貨'];
}

function shipmentSheetCandidates() { return shipmentSheetCandidatesFor(new Date()); }

function findShipmentSheet(ss, date) {
  date = date || new Date();
  for (const name of shipmentSheetCandidatesFor(date)) {
    const s = ss.getSheetByName(name);
    if (s) return s;
  }
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const m = parseInt(Utilities.formatDate(date, tz, 'M'), 10), day = parseInt(Utilities.formatDate(date, tz, 'd'), 10);
  const patterns = [new RegExp(`(^|[^0-9])${m}/${day}([^0-9]|$)`), new RegExp(`(^|[^0-9])${m}月${day}日`)];
  for (const sheet of ss.getSheets()) {
    if (!/出貨/.test(sheet.getName())) continue;
    if (patterns.some(p => p.test(sheet.getName()))) return sheet;
  }
  return null;
}

function parseShipmentSheetDate(name) {
  if (!/出貨/.test(name)) return null;
  let m = name.match(/(\d{1,2})[\/月\-](\d{1,2})日?\s*出貨/);
  if (m) return new Date(new Date().getFullYear(), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  m = name.match(/(\d{2})(\d{2})\s*出貨/);
  if (m) return new Date(new Date().getFullYear(), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  return null;
}

function parseDateHeader(h) {
  if (h instanceof Date) return normalizeDebugDate(h);
  const s = String(h || '').trim();
  let m = s.match(/^(\d{1,2})月(\d{1,2})日$/) || s.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return normalizeDebugDate(new Date(new Date().getFullYear(), parseInt(m[1], 10) - 1, parseInt(m[2], 10)));
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return normalizeDebugDate(new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)));
  return null;
}

function runRedoFromDate() {
  const ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  const todayStr = Utilities.formatDate(new Date(), tz, 'M/d');

  const resp = ui.prompt('🔁 從指定日重做', `輸入「起始日」(M/D)\n\n空白 = 今天 ${todayStr}`, ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  let input = resp.getResponseText().trim() || todayStr;
  const dm = input.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!dm) return ui.alert('日期格式錯誤', '請用 M/D 格式', ui.ButtonSet.OK);

  const startDate = new Date(new Date().getFullYear(), parseInt(dm[1], 10) - 1, parseInt(dm[2], 10));
  startDate.setHours(0, 0, 0, 0);
  const startLabel = Utilities.formatDate(startDate, tz, 'M/d');

  const toDelete = [];
  for (const cfg of STOCK_SHEETS) {
    const sheet = getSheetByLogicalName(ss, cfg.name);
    if (!sheet) continue;
    const headers = sheet.getDataRange().getValues()[0];
    for (let c = 0; c < headers.length; c++) {
      if (!isDateHeader(headers[c])) continue;
      const d = parseDateHeader(headers[c]);
      if (d && d > startDate) toDelete.push({sheetName: cfg.name, col1idx: c + 1, headerText: formatHeader(headers[c])});
    }
  }

  const shipSheets = [];
  for (const sheet of ss.getSheets()) {
    const date = parseShipmentSheetDate(sheet.getName());
    if (date && date > startDate) shipSheets.push({sheet, date, name: sheet.getName()});
  }
  shipSheets.sort((a, b) => a.date - b.date);

  const ok = ui.alert('🔁 確認重做', `將刪除 ${toDelete.length} 個欄位，並重做 ${shipSheets.length} 個出貨表。\n確定？`, ui.ButtonSet.OK_CANCEL);
  if (ok !== ui.Button.OK) return;

  for (const cfg of STOCK_SHEETS) {
    const sheet = getSheetByLogicalName(ss, cfg.name);
    if (!sheet) continue;
    const headers = sheet.getDataRange().getValues()[0];
    for (let c = headers.length - 1; c >= 0; c--) {
      const d = parseDateHeader(headers[c]);
      if (d && d > startDate && isDateHeader(headers[c])) sheet.deleteColumn(c + 1);
    }
  }

  const summary = [`已刪除 ${toDelete.length} 個欄位`, ''];
  if (shipSheets.length === 0) summary.push(`找不到 ${startLabel} 之後的出貨分頁`);
  else {
    for (const s of shipSheets) {
      const result = dispatch(false, {silent: true, targetDate: s.date, shipSheet: s.sheet});
      if (!result) summary.push(`${s.name}：⚠️ 中止`);
      else if (result.skipped) summary.push(`${s.name}：⏭️ ${result.reason}`);
      else if (result.error) summary.push(`${s.name}：❌ ${result.error}`);
      else summary.push(`${s.name}：✅ 扣帳 ${result.deductions} 筆、警告 ${result.warnings}`);
    }
  }
  ui.alert('🔁 重做完成', summary.join('\n'), ui.ButtonSet.OK);
}

function runBatchDispatch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), ui = SpreadsheetApp.getUi();
  const shipSheets = [];
  for (const sheet of ss.getSheets()) {
    const date = parseShipmentSheetDate(sheet.getName());
    if (date) shipSheets.push({sheet, date, name: sheet.getName()});
  }

  if (shipSheets.length === 0) return ui.alert('找不到任何出貨分頁');
  shipSheets.sort((a, b) => a.date - b.date);

  if (ui.alert('批次扣帳', `將處理：\n${shipSheets.map(s => '  ' + s.name).join('\n')}\n\n確定？`, ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;

  const summary = [];
  for (const s of shipSheets) {
    const result = dispatch(false, {silent: true, targetDate: s.date, shipSheet: s.sheet});
    if (!result) { summary.push(`${s.name}：⚠️ 中止`); break; }
    if (result.skipped) summary.push(`${s.name}：⏭️ ${result.reason}`);
    else if (result.error) summary.push(`${s.name}：❌ ${result.error}`);
    else summary.push(`${s.name}：✅ 扣帳 ${result.deductions} 筆、警告 ${result.warnings}`);
  }
  ui.alert('批次扣帳完成', summary.join('\n'), ui.ButtonSet.OK);
}

function parseExpiry(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return v.getTime();
  const s = String(v).trim();
  if (s === '//' || /無保存期限|沒效期/.test(s)) return null;
  const m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  return null;
}

function formatExpiry(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone() || 'Asia/Taipei', 'M/d');
  return String(v).replace(/^\d{4}\//, '');
}

function getBoxSize(name, prevQty, prevBoxStr) {
  const m = String(name).match(/[\*＊x×\(](\d+)\s*(包|罐|條|盒|片|瓶|組|桶|顆|支|袋)\s*\/\s*箱/);
  if (m) return parseInt(m[1], 10);
  if (prevQty > 0 && prevBoxStr) {
    const bm = prevBoxStr.match(/(\d+)\s*箱\s*(\d+)/);
    if (bm && parseInt(bm[1], 10) > 0) return Math.round((prevQty - parseInt(bm[2], 10)) / parseInt(bm[1], 10));
  }
  return null;
}

function formatBoxBreakdown(total, boxSize, unit, style) {
  if (!boxSize || boxSize <= 0 || total < 0) return '';
  const t = total || 0;
  const boxes = Math.floor(t / boxSize), remain = t - boxes * boxSize;
  if (style === 'boxOnly' && remain === 0 && boxes > 0) return `${boxes}箱`;
  return `${boxes}箱${remain}${unit || ''}`;
}

function detectBoxStyle(prevBoxCell) {
  const m = String(prevBoxCell || '').trim().match(/(\d+)\s*箱(\s*(\d+))?/);
  return m ? (m[3] !== undefined ? 'full' : 'boxOnly') : null;
}

function isBlankCell(v) { return v === '' || v === null || v === undefined; }

function mergeNote(existing, newScriptText) {
  const e = String(existing || '');
  const sIdx = e.indexOf(NOTE_AUTO_START);
  let before = '', after = '';
  if (sIdx >= 0) {
    before = e.substring(0, sIdx);
    const tail = e.substring(sIdx + NOTE_AUTO_START.length);
    const eIdx = tail.indexOf(NOTE_AUTO_END);
    if (eIdx >= 0) after = tail.substring(eIdx + NOTE_AUTO_END.length);
  } else { before = e; }

  const beforeT = before.replace(/\s+$/, ''), afterT  = after.replace(/^\s+/, '');
  if (!newScriptText) return [beforeT, afterT].filter(s => s).join('\n') || null;

  if (typeof newScriptText === 'object') {
    const autoText = String(newScriptText.autoText || '').trim();
    const visibleText = String(newScriptText.visibleText || '').trim();
    const head = [beforeT, autoText ? NOTE_AUTO_START + autoText + NOTE_AUTO_END : ''].filter(s => s).join('\n');
    const tail = [afterT, visibleText].filter(s => s).join('\n');
    if (head && tail) return head + '\n\n' + tail;
    return head || tail || null;
  }

  return [beforeT, NOTE_AUTO_START + newScriptText + NOTE_AUTO_END, afterT].filter(s => s).join('\n');
}

function formatTakenLine(t) {
  if (t.type === 'swap')   return `${t.store} +${t.qty}-${t.qty} ${t.unit}(換貨)`;
  if (t.type === 'return') return `${t.store} +${t.qty} ${t.unit}(退回)`;
  return `${t.store} ${t.qty} ${t.unit}${t.showTotal ? `(共${t.orderQty}${t.unit})` : ''}`;
}

function formatTakenNote(taken) {
  const autoLines = [];
  const visibleLines = [];
  for (const t of taken || []) {
    if (t.type === 'swap') visibleLines.push(formatTakenLine(t));
    else autoLines.push(formatTakenLine(t));
  }
  return {
    autoText: autoLines.join('\n'),
    visibleText: visibleLines.join('\n'),
  };
}

function isValidStoreText(store) {
  if (!store) return false;
  const cleaned = String(store).replace(/[\s\-]+/g, '');
  if (cleaned.length < 2) return false;
  return !/^\d/.test(cleaned);
}

function normalizeStoreKey(s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); }

function normalizeDedicatedKey(s) {
  return normalizeStoreKey(s)
    .replace(/專用|勿動|的/g, '')
    .replace(/[＊*x×]\d+/g, '')
    .replace(/[，,。．.、:：;；()（）\[\]【】\-_/\\]/g, '');
}

function isReservedStockNote(note) {
  return /專用|勿動|暫不出貨|暫停出貨|不出貨|是.+的/.test(String(note || ''));
}

function stockNoteMatchesStore(note, store) {
  const noteKey = normalizeDedicatedKey(note);
  const storeKey = normalizeDedicatedKey(store);
  if (!noteKey || !storeKey) return false;
  if (noteKey.length < 2 || storeKey.length < 2) return false;
  return noteKey.indexOf(storeKey) >= 0 || storeKey.indexOf(noteKey) >= 0;
}

function shouldSkipReservedBatchForStore(note, store) {
  return isReservedStockNote(note) && !stockNoteMatchesStore(note, store);
}

function orderBatchesForShipmentItem(batches, item) {
  return batches.filter(b => !shouldSkipReservedBatchForStore(b.stockNote, item.store)).sort((a, b) => {
    const am = stockNoteMatchesStore(a.stockNote, item.store) ? 0 : 1;
    const bm = stockNoteMatchesStore(b.stockNote, item.store) ? 0 : 1;
    if (am !== bm) return am - bm;
    return a.row - b.row;
  });
}

function findPreferredStockedBatch(batches, item) {
  const ordered = orderBatchesForShipmentItem(batches, item);
  for (let i = ordered.length - 1; i >= 0; i--) if (ordered[i].prevQty > 0) return ordered[i];
  return ordered[ordered.length - 1];
}

function findPreferredNoteBatch(batches, item) {
  const ordered = orderBatchesForShipmentItem(batches, item);
  for (const b of ordered) if (b.prevQty > 0 || b.newQty > 0) return b;
  return ordered[0];
}

function movementCountKey(item) {
  const kind = (item.isSwap || item.swap) ? 'swap' : ((item.isAdd || item.return) ? 'add' : 'sub');
  return [normalizeStoreKey(item.store), String(item.unit || '').trim(), kind].join('|');
}

function addAppliedMovement(map, item) {
  const key = movementCountKey(item);
  map[key] = (map[key] || 0) + (item.qty || 0);
  if (item.unit) {
    const noUnit = Object.assign({}, item, {unit: ''});
    const blankKey = movementCountKey(noUnit);
    map[blankKey] = (map[blankKey] || 0) + (item.qty || 0);
  }
}

function buildAppliedMovementMap(batches) {
  const map = {};
  for (const b of batches || []) {
    for (const d of b.noteDeductions || []) addAppliedMovement(map, d);
  }
  return map;
}

function consumeAppliedMovementQty(map, item) {
  const key = movementCountKey(item);
  const blankKey = movementCountKey(Object.assign({}, item, {unit: ''}));
  let available = map[key] || 0;
  let use = Math.min(item.qty || 0, available);
  if (use > 0) {
    map[key] = available - use;
    if (item.unit && map[blankKey]) map[blankKey] = Math.max(0, map[blankKey] - use);
    return use;
  }

  available = map[blankKey] || 0;
  use = Math.min(item.qty || 0, available);
  if (use > 0) map[blankKey] = available - use;
  return use;
}

function movementKey(item) {
  return [
    normalizeStoreKey(item.store),
    item.qty || 0,
    String(item.unit || '').trim(),
    item.isAdd ? 'add' : 'sub'
  ].join('|');
}

function buildMovementKeySet(items) {
  const set = new Set();
  for (const item of items || []) {
    set.add(movementKey(item));
    if (item.unit) set.add(movementKey(Object.assign({}, item, {unit: ''})));
  }
  return set;
}

function buildShipMovementMap(shipments) {
  const map = {};
  for (const code of Object.keys(shipments)) {
    map[code] = [];
    for (const it of shipments[code].items) {
      if (it.swap) continue;
      map[code].push({
        store: it.store,
        qty: it.qty,
        unit: it.unit,
        isAdd: !!it.return,
      });
    }
  }
  return map;
}

function getShipMovementsForCode(shipMovementMap, stockCode) {
  if (shipMovementMap[stockCode]) return shipMovementMap[stockCode];
  for (const shipKey of Object.keys(shipMovementMap)) {
    if (shipKey.length >= 2 && (stockCode.startsWith(shipKey) || shipKey.startsWith(stockCode))) return shipMovementMap[shipKey];
  }
  return [];
}

function findLastStockedBatch(batches) {
  for (let i = batches.length - 1; i >= 0; i--) if (batches[i].prevQty > 0) return batches[i];
  return batches[batches.length - 1];
}

function isDateHeader(h) {
  if (h instanceof Date) return true;
  const s = String(h || '').trim();
  return /^\d{1,2}月\d{1,2}日$/.test(s) || /^\d{1,2}[\/\-]\d{1,2}$/.test(s) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(s);
}

function sameDateHeader(a, b) {
  if (a instanceof Date && b instanceof Date) return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  return String(a).trim() === String(b).trim();
}

function isSameDate(h, targetDate) {
  const parsed = parseDateHeader(h);
  return !!parsed &&
    parsed.getFullYear() === targetDate.getFullYear() &&
    parsed.getMonth() === targetDate.getMonth() &&
    parsed.getDate() === targetDate.getDate();
}

function parseDateRange(input) {
  const yr = new Date().getFullYear(), parts = input.split(/[\-~～]/);
  if (parts.length === 1) {
    const m = parts[0].trim().match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!m) return null;
    const d = new Date(yr, parseInt(m[1], 10) - 1, parseInt(m[2], 10)); d.setHours(0, 0, 0, 0);
    return {start: d, end: d};
  }
  if (parts.length === 2) {
    const m1 = parts[0].trim().match(/^(\d{1,2})\/(\d{1,2})$/), m2 = parts[1].trim().match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!m1 || !m2) return null;
    const start = new Date(yr, parseInt(m1[1], 10) - 1, parseInt(m1[2], 10)), end = new Date(yr, parseInt(m2[1], 10) - 1, parseInt(m2[2], 10));
    start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
    return start > end ? {start: end, end: start} : {start, end};
  }
  return null;
}

function parseSingleDateInput(input) {
  const yr = new Date().getFullYear();
  const m = String(input || '').trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const d = new Date(yr, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  d.setHours(0, 0, 0, 0);
  return d;
}

function datesInRange(startDate, endDate) {
  const dates = [], cur = new Date(startDate.getTime());
  while (cur <= endDate) { dates.push(new Date(cur.getTime())); cur.setDate(cur.getDate() + 1); }
  return dates;
}

function buildVerifyContext(sheet, cfg, targetDate) {
  targetDate = targetDate || (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const data = sheet.getDataRange().getValues(), headers = data[0] || [], cols = detectStockColumns(headers);
  if (cols.code === undefined || cols.name === undefined || cols.expiry === undefined) return {error: '欄位偵測失敗'};

  let todayRightCol = -1;
  for (let c = headers.length - 1; c > cols.expiry; c--) if (isSameDate(headers[c], targetDate)) { todayRightCol = c; break; }
  if (todayRightCol < 0) return {error: '沒有該日的欄位'};
  const todayLeftCol = (todayRightCol > 0 && sameDateHeader(headers[todayRightCol], headers[todayRightCol - 1])) ? todayRightCol - 1 : todayRightCol;

  let yesterdayRightCol = -1;
  for (let c = todayLeftCol - 1; c > cols.expiry; c--) if (isDateHeader(headers[c]) && !isSameDate(headers[c], targetDate)) { yesterdayRightCol = c; break; }
  if (yesterdayRightCol < 0) return {error: '找不到前一日期欄'};
  const yesterdayLeftCol = (yesterdayRightCol > 0 && sameDateHeader(headers[yesterdayRightCol], headers[yesterdayRightCol - 1])) ? yesterdayRightCol - 1 : yesterdayRightCol;

  return {sheet, data, headers, cols, config: cfg, todayLeftCol, todayRightCol, yesterdayLeftCol, yesterdayRightCol};
}

function buildSheetContext(sheet) {
  const data = sheet.getDataRange().getValues(), headers = data[0] || [], cols = detectStockColumns(headers);
  if (cols.code === undefined || cols.name === undefined || cols.expiry === undefined) return {error: '偵測欄位失敗'};

  let prevRightCol = -1;
  for (let c = headers.length - 1; c > cols.expiry; c--) if (isDateHeader(headers[c])) { prevRightCol = c; break; }
  if (prevRightCol < 0) prevRightCol = cols.expiry;
  const prevLeftCol = (prevRightCol > cols.expiry && sameDateHeader(headers[prevRightCol], headers[prevRightCol - 1])) ? prevRightCol - 1 : prevRightCol;

  return {sheet, data, headers, cols, prevLeftCol, prevRightCol};
}

function detectStockColumns(headers) {
  const cols = {};
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c] || '').trim();
    if (!h) continue;
    if (cols.code === undefined && /(編號|品號|貨號|料號)/.test(h)) cols.code = c;
    else if (cols.name === undefined && /(品名|名稱|品項)/.test(h)) cols.name = c;
    else if (cols.note === undefined && /(備註|註記|備考)/.test(h)) cols.note = c;
    else if (cols.unit === undefined && /單位/.test(h)) cols.unit = c;
    else if (cols.expiry === undefined && /(到期日|效期|保存期)/.test(h)) cols.expiry = c;
  }
  return cols;
}

function formatHeader(h) { return h instanceof Date ? Utilities.formatDate(h, Session.getScriptTimeZone() || 'Asia/Taipei', 'M月d日') : String(h || ''); }

function colLetter(idx) {
  let s = '', n = idx;
  while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
  return s;
}

function findFuzzyCode(skuMap, code) {
  if (skuMap[code]) return code;
  if (skuMap[code + '001']) return code + '001';
  const matches = Object.keys(skuMap).filter(k => k.startsWith(code));
  if (matches.length === 1) return matches[0];
  return null;
}

function showPreview(log, warnings, today) {
  const ui = SpreadsheetApp.getUi();
  const sample = log.slice(0, 25).map(d => `${d.code} ${d.store || ''} ${d.qty}${d.unit}` + (d.swap ? ' [換貨]' : d.batch ? ` → ${d.batch}` : '') + (d.warning ? ` ⚠️ ${d.warning}` : ''));
  ui.alert(`預覽 ${today}（前 25 筆）`, sample.join('\n') + (log.length > 25 ? `\n…還有 ${log.length - 25} 筆` : '') + `\n\n總計：${log.length} 筆扣帳、${warnings.length} 警告`, ui.ButtonSet.OK);
}
