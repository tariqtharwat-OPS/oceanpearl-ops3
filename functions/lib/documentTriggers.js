const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

exports.validateDocumentRequest = onDocumentCreated("document_requests/{requestId}", (event) => {
    logger.info("Trigger fired!", { id: event.params.requestId });
});
