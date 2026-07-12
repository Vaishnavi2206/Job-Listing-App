/**
 * Bull Board — visual dashboard to inspect queued/active/failed/completed
 * jobs, view failure reasons, and manually retry a failed job (e.g. one
 * that exhausted all attempts because SMTP was down).
 *
 * Run separately: `npm run dashboard`, then open http://localhost:3001
 *
 * In production, put this behind auth (basic auth / SSO) and never expose
 * it publicly — it can trigger retries/removals of real jobs.
 */

const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { emailQueue } = require('../queues/email.queue');
require('dotenv').config();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

const app = express();
app.use('/admin/queues', serverAdapter.getRouter());

const PORT = process.env.BULL_BOARD_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Bull Board running at http://localhost:${PORT}/admin/queues`);
});
