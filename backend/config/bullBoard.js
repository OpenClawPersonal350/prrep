/**
 * Bull Board Queue Monitoring Setup
 * Accessible at /admin/queues
 */

const { createBullBoard } = require('@bull-board/api');
const { ExpressAdapter } = require('@bull-board/express');
const { replyQueue } = require('../queues/reply.queue');

// Create Bull adapters for each queue
const adapters = [
  new ExpressAdapter().setQueues(replyQueue)
];

// Create Bull Board instance
const { router: bullBoardRouter } = createBullBoard(adapters);

// Export for use in server.js
module.exports = {
  bullBoardRouter
};
