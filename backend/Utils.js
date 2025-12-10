/**
 * Membuat response JSON standar dengan Header CORS
 * Agar bisa diakses dari Github Pages / React
 */
function createJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Format error response
 */
function createErrorResponse(message) {
  return createJSONResponse({
    status: 'error',
    message: message
  });
}

/**
 * Format success response
 */
function createSuccessResponse(data, message = 'Success') {
  return createJSONResponse({
    status: 'success',
    message: message,
    data: data
  });
}

/**
 * Generate UUID sederhana untuk ID Responden
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}