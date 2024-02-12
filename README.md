# TaskRouter events and batch processing framework

Written By: Jared Hunter

There are many long-running backend operations we want to be able to provide, but are currently hampered by the short runtime for Twilio serverless functions.  Well, not any longer!

This repo introduces a protocol around batch processing that allows us create a array of work items that are then processed in batch, handing results from function to function in a daisy-chained manner.

The use case tackled to flush out this protocol was syncing worker objects with an array of their eligible queue SIDs - which could then be used, for example, on the Flex teams view to concretely see which workers are eligible for which queues.

Some points to note about this approach:
- The worker object has a max 4KB object size; 56 queue SIDs will take up about half this available space, so there is a limit to the success of this approach.
- Extensive testing with batch processing has shown it to work very reliably. I have been testing 5100 agents and the processing takes ~5 minutes, the error handling we have built into all of our functions has paid dividends here.
- In the future I imagine this approach being used for en masse updates of worker skills or anything else that will take a lot of operations.
- The batch processor passes back a Sync doc ID that can be used to monitor progress on the front end for future use cases.

## Disclaimer

**This software is to be considered "sample code", a Type B Deliverable, and is delivered "as-is" to the user. Twilio bears no responsibility to support the use or implementation of this software.**

## Pre-requisites

Make sure you have [Node.js](https://nodejs.org) 18 as well as [`npm`](https://npmjs.com) installed.

Next, please install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart). If you are using Homebrew on macOS, you can do so by running:

```bash
brew tap twilio/brew && brew install twilio
```

Finally, install the [serverless plugin](https://www.twilio.com/docs/labs/serverless-toolkit/getting-started) for the Twilio CLI:

```bash
twilio plugins:install @twilio-labs/plugin-serverless
```

## Installation

First, clone the repository, change to its directory, and install:

```bash
git clone https://github.com/twilio-professional-services/tr-events-batch-processing.git

cd tr-events-batch-processing
npm install
```

Then, copy `.env.example` to `.env` and populate the following variables:

- TWILIO_FLEX_WORKSPACE_SID    - assign the value of your Flex workspace
- TWILIO_FLEX_SYNC_SID         - assign the value of the Sync service to use

Then, deploy the serverless functions:

```bash
twilio serverless:deploy
```

This will output a serverless domain for the deployed functions. We will use this in the next step.

Finally, we will set the deployed function to be used as the TaskRouter event callback:
1. Open Twilio Console > TaskRouter > Workspaces
2. Select the TaskRouter workspace, then choose Settings.
3. Set the "Event callback URL" to `https://SERVERLESS_DOMAIN_FROM_ABOVE_GOES_HERE/event-handler`
4. For "Callback events", select "Specific events"
5. Select the following events:
   - Task Queue Created
   - Task Queue Target Workers Expression Updated
   - Worker Created
   - Worker Attributes Updated
6. Click "Save"