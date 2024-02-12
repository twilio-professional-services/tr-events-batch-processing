const { isString, isObject } = require('lodash');

const retryHandler = require(Runtime.getFunctions()['common/helpers/retry-handler'].path).retryHandler;

/**
 * @param {object} parameters the parameters for the function
 * @param {number} parameters.attempts the number of retry attempts performed
 * @param {object} parameters.context the context from calling lambda function
 * @param {string} parameters.uniqueName the unique name of the Sync document (optional)
 * @param {number} parameters.ttl how long (in seconds) before the Sync Document expires and is deleted (optional)
 * @param {object} parameters.data schema-less object that the Sync Document stores - 16 KiB max (optional)
 * @returns {object} A new Sync document
 * @description the following method is used to create a sync document
 */
exports.createDocument = async function createDocument(parameters) {
  const { context, uniqueName, ttl, data } = parameters;

  if (!isObject(context)) throw new Error('Invalid parameters object passed. Parameters must contain context object');
  if (Boolean(uniqueName) && !isString(uniqueName))
    throw new Error('Invalid parameters object passed. Parameters must contain uniqueName string value');
  if (Boolean(ttl) && !isString(ttl))
    throw new Error('Invalid parameters object passed. Parameters must contain ttl integer value');
  if (Boolean(data) && !isObject(data))
    throw new Error('Invalid parameters object passed. Parameters must contain data object');

  try {
    const client = context.getTwilioClient();
    const documentParameters = {
      uniqueName,
      ttl,
      data,
    };

    const document = await client.sync.v1.services(context.TWILIO_FLEX_SYNC_SID).documents.create(documentParameters);

    return { success: true, status: 200, document };
  } catch (error) {
    return retryHandler(error, parameters, exports.createDocument);
  }
};

/**
 * @param {object} parameters the parameters for the function
 * @param {number} parameters.attempts the number of retry attempts performed
 * @param {object} parameters.context the context from calling lambda function
 * @param {string} parameters.documentSid the sid of the Sync document
 * @returns {object} A Sync document
 * @description the following method is used to fetch a sync document
 */
exports.fetchDocument = async function fetchDocument(parameters) {
  const { context, documentSid } = parameters;

  if (!isObject(context)) throw new Error('Invalid parameters object passed. Parameters must contain context object');
  if (!isString(documentSid))
    throw new Error('Invalid parameters object passed. Parameters must contain documentSid string value');

  try {
    const client = context.getTwilioClient();

    const document = await client.sync.v1.services(context.TWILIO_FLEX_SYNC_SID).documents(documentSid).fetch();

    return { success: true, status: 200, document };
  } catch (error) {
    return retryHandler(error, parameters, exports.fetchDocument);
  }
};

/**
 * @param {object} parameters the parameters for the function
 * @param {number} parameters.attempts the number of retry attempts performed
 * @param {object} parameters.context the context from calling lambda function
 * @param {string} parameters.documentSid the sid of the Sync document
 * @param {object} parameters.updateData the data object to update on the Sync document
 * @returns {object} A Sync document
 * @description the following method is used to fetch a sync document
 */
exports.updateDocumentData = async function updateDocumentData(parameters) {
  const { context, documentSid, updateData } = parameters;

  if (!isObject(context)) throw new Error('Invalid parameters object passed. Parameters must contain context object');
  if (!isString(documentSid))
    throw new Error('Invalid parameters object passed. Parameters must contain documentSid string value');
  if (!isObject(updateData))
    throw new Error('Invalid parameters object passed. Parameters must contain updateData object');

  try {
    const client = context.getTwilioClient();

    const documentUpdate = await client.sync.v1
      .services(context.TWILIO_FLEX_SYNC_SID)
      .documents(documentSid)
      .update({ data: updateData });

    return { success: true, status: 200, document: documentUpdate };
  } catch (error) {
    return retryHandler(error, parameters, exports.updateDocumentData);
  }
};
