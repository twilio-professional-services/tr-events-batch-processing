const { isString, isObject } = require('lodash');

const retryHandler = require(Runtime.getFunctions()['common/helpers/retry-handler'].path).retryHandler;

/**
 * @param {object} parameters the parameters for the function
 * @param {number} parameters.attempts the number of retry attempts performed
 * @param {object} parameters.context the context from calling lambda function
 * @param {object} filters the filters to apply to the query
 * @returns {object} An object containing an array of queues for the account
 * @description the following method is used to robustly retrieve
 *   the queues for the account
 */
exports.getQueues = async function getQueues(parameters) {
  const { context } = parameters;
  const {
    filters = {
      // example filters
      // workerSid: 'WK608fc1212a5461111704ec6ed1192dce',
      // evaluateWorkerAttributes: JSON.stringify({ routing: { skills: [] } }),
      // friendlyName: 'Everyone'
    },
  } = parameters;

  if (!isObject(context)) throw new Error('Invalid parameters object passed. Parameters must contain context object');

  try {
    const client = context.getTwilioClient();
    const queues = await client.taskrouter.v1
      .workspaces(process.env.TWILIO_FLEX_WORKSPACE_SID)
      .taskQueues.list({ ...filters, limit: 1000 });

    return {
      success: true,
      status: 200,
      queues,
    };
  } catch (error) {
    return retryHandler(error, parameters, exports.getQueues);
  }
};

exports.updateWorkerAttributes = async function updateWorkerAttributes(parameters) {
  const { context, workerSid, workerAttributes } = parameters;

  if (!isObject(context)) throw new Error('Invalid parameters object passed. Parameters must contain context object');

  try {
    const client = context.getTwilioClient();
    const worker = await client.taskrouter.v1
      .workspaces(process.env.TWILIO_FLEX_WORKSPACE_SID)
      .workers(workerSid)
      .update({ attributes: JSON.stringify(workerAttributes) });

    return {
      success: true,
      status: 200,
      worker: {
        ...worker,
        attributes: JSON.parse(worker.attributes),
      },
    };
  } catch (error) {
    return retryHandler(error, parameters, exports.updateWorkerAttributes);
  }
};

/**
 * @param {object} parameters the parameters for the function
 * @param {number} parameters.attempts the number of retry attempts performed
 * @param {object} parameters.context the context from calling lambda function
 * @param {string} parameters.workerSid the worker sid to fetch channels for
 * @returns {object} worker channel object
 * @description the following method is used to fetch the configured
 *   worker channel
 */
exports.getWorker = async function getWorker(parameters) {
  const { context, workerSid } = parameters;

  if (!isObject(context)) throw new Error('Invalid parameters object passed. Parameters must contain context object');
  if (!isString(workerSid))
    throw new Error('Invalid parameters object passed. Parameters must contain workerSid string');

  try {
    const client = context.getTwilioClient();
    const worker = await client.taskrouter.v1
      .workspaces(process.env.TWILIO_FLEX_WORKSPACE_SID)
      .workers(workerSid)
      .fetch();

    return {
      success: true,
      status: 200,
      worker: {
        ...worker,
        attributes: JSON.parse(worker.attributes),
      },
    };
  } catch (error) {
    return retryHandler(error, parameters, exports.getWorker);
  }
};

exports.getEligibleWorkers = async function getEligibleWorkers(parameters) {
  const { context, targetWorkersExpression, workerSidOnly = false } = parameters;

  if (!isObject(context)) throw new Error('Invalid parameters object passed. Parameters must contain context object');
  if (!isString(targetWorkersExpression))
    throw new Error('Invalid parameters object passed. Parameters must contain targetWorkerExpression string');

  try {
    const client = context.getTwilioClient();

    // https://www.twilio.com/docs/usage/twilios-response#response-formats-list-filters
    let workers = await client.taskrouter.v1.workspaces(process.env.TWILIO_FLEX_WORKSPACE_SID).workers.list({
      targetWorkersExpression,
      pageSize: 500,
      limit: 20000,
    });

    if (workerSidOnly) {
      workers = workers.map((worker) => {
        const { sid } = worker;
        return {
          sid,
        };
      });
    }

    return {
      success: true,
      status: 200,
      workers,
    };
  } catch (error) {
    return retryHandler(error, parameters, exports.getEligibleWorkers);
  }
};
