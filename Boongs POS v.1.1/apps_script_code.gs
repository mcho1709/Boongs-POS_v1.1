// ============================================================
// Google Apps Script — Food Truck POS → Google Sheets 연동
// ============================================================
// 사용 방법:
//   1. https://script.google.com 에서 새 프로젝트 생성
//   2. 아래 코드를 전체 복사하여 붙여넣기
//   3. 우측상단 ▶ 실행 버튼 클릭 (권한 승인 팝업 나올 때 "액세스 허용")
//   4. 상단 메뉴 > 배포 > 새 배포 클릭
//   5. 유형: 웹 앱 / 실행으로: 본인 계정 / 액세스: 모든 사람
//   6. 배포 후 나온 URL을 Food Truck POS의 Setup에서 Apps Script URL에 붙여넣기
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.parameter.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 날짜로 시트명 생성 (예: 2025-02-01)
    const dateStr = new Date().toISOString().split('T')[0];
    let sheet = ss.getSheetByName(dateStr);
    
    // 해당 날짜 시트가 없으면 생성
    if (!sheet) {
      sheet = ss.insertSheet(dateStr);
      setupSheet(sheet, data);
    }

    // 다음 빈 행 찾기
    const lastRow = sheet.getLastRow();
    const writeRow = lastRow + 2; // 한 칸 간격

    // ─── 세션 요약 섹션 ───
    sheet.getRange(writeRow, 1).setValue('=== 세션 요약 ===');
    sheet.getRange(writeRow, 1).setFontWeight('bold');
    sheet.getRange(writeRow + 1, 1).setValue('날짜');
    sheet.getRange(writeRow + 1, 2).setValue(data.date);
    sheet.getRange(writeRow + 2, 1).setValue('장소');
    sheet.getRange(writeRow + 2, 2).setValue(data.location);
    sheet.getRange(writeRow + 3, 1).setValue('총 주문수');
    sheet.getRange(writeRow + 3, 2).setValue(data.totalOrders);
    sheet.getRange(writeRow + 4, 1).setValue('총 매출');
    sheet.getRange(writeRow + 4, 2).setValue(data.totalSales);
    sheet.getRange(writeRow + 4, 2).setNumberFormat('$#,##0.00');

    // ─── 메뉴별 요약 ───
    let row = writeRow + 6;
    sheet.getRange(row, 1).setValue('=== 메뉴별 요약 ===');
    sheet.getRange(row, 1).setFontWeight('bold');
    row++;
    sheet.getRange(row, 1).setValue('메뉴');
    sheet.getRange(row, 2).setValue('수량');
    sheet.getRange(row, 3).setValue('단가');
    sheet.getRange(row, 4).setValue('금액');
    sheet.getRange(row, 1, 1, 4).setFontWeight('bold');
    sheet.getRange(row, 1, 1, 4).setBackground('#e8f0fe');
    row++;

    const summary = data.summary;
    for (const [item, info] of Object.entries(summary)) {
      sheet.getRange(row, 1).setValue(item);
      sheet.getRange(row, 2).setValue(info.quantity);
      sheet.getRange(row, 3).setValue(data.menuPrices[item] || 0);
      sheet.getRange(row, 3).setNumberFormat('$#,##0.00');
      sheet.getRange(row, 4).setValue(info.amount);
      sheet.getRange(row, 4).setNumberFormat('$#,##0.00');
      row++;
    }

    // ─── 주문별 상세 ───
    row += 1;
    sheet.getRange(row, 1).setValue('=== 주문별 상세 ===');
    sheet.getRange(row, 1).setFontWeight('bold');
    row++;
    sheet.getRange(row, 1).setValue('주문번호');
    sheet.getRange(row, 2).setValue('시간');
    sheet.getRange(row, 3).setValue('아이템');
    sheet.getRange(row, 4).setValue('금액');
    sheet.getRange(row, 1, 1, 4).setFontWeight('bold');
    sheet.getRange(row, 1, 1, 4).setBackground('#e8f0fe');
    row++;

    for (const docket of data.dockets) {
      const itemsStr = Object.entries(docket.items)
        .map(([item, qty]) => `${item} x${qty}`)
        .join(', ');
      
      sheet.getRange(row, 1).setValue('#' + docket.number);
      sheet.getRange(row, 2).setValue(docket.time);
      sheet.getRange(row, 3).setValue(itemsStr);
      sheet.getRange(row, 4).setValue(docket.total);
      sheet.getRange(row, 4).setNumberFormat('$#,##0.00');
      row++;
    }

    // CORS 허용을 위한 응답
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data saved' }))
      .setMimeType(ContentService.MIME_TYPE.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MIME_TYPE.JSON);
  }
}

// 첫 시트 생성 시 헤더 설정
function setupSheet(sheet, data) {
  sheet.getRange(1, 1).setValue('Food Truck POS — 매출 기록');
  sheet.getRange(1, 1).setFontWeight('bold');
  sheet.getRange(1, 1).setFontSize(14);
  sheet.getRange(1, 1).setFontColor('#3b82f6');
  
  // 열 너비 조정
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 300);
  sheet.setColumnWidth(4, 120);
}
