/**
 * API GATEWAY SIM SURVEI
 */

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getConfig') return getSurveyConfig();
  else if (action === 'getServices') return getSurveyServices();
  else if (action === 'getStats') return getSurveyStats();
  else if (action === 'getHistory') return getSurveyHistory();
  else if (action === 'getInfo') return getSurveyInfo(); // [BARU]
  else return createErrorResponse("Action tidak dikenali.");
}

function doPost(e) {
  if (!e.postData || !e.postData.contents) {
    return createErrorResponse("Tidak ada data yang dikirim");
  }
  return saveSurveyResponse(e.postData.contents);
}