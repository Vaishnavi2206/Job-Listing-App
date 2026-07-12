/**
 * Idempotency ledger for sent notifications.
 *
 * In your real app this should be a table in your existing DB (SQL Server /
 * Postgres — you already have one for CPQ applications), e.g.:
 *
 *   CREATE TABLE ApplicationNotificationLog (
 *     Id            BIGINT IDENTITY PRIMARY KEY,
 *     ApplicationId NVARCHAR(50) NOT NULL,
 *     Status        NVARCHAR(20) NOT NULL,
 *     MessageId     NVARCHAR(200) NULL,
 *     SentAt        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 *     CONSTRAINT UQ_App_Status UNIQUE (ApplicationId, Status)
 *   );
 *
 * The UNIQUE constraint is what actually guarantees no double-send even
 * under race conditions across multiple worker replicas — the BullMQ
 * jobId dedup handles the common case, this DB constraint is your last
 * line of defense.
 *
 * This file is an in-memory stub so the project is runnable standalone.
 * Replace with real queries (e.g. via your .NET Web API, or a direct
 * mssql/pg client call) before shipping.
 */

const sentLog = new Map(); // key: `${applicationId}:${status}` -> messageId

async function wasNotificationSent(applicationId, status) {
  return sentLog.has(`${applicationId}:${status}`);
}

async function recordNotificationSent(applicationId, status, messageId) {
  sentLog.set(`${applicationId}:${status}`, messageId);
}

module.exports = { wasNotificationSent, recordNotificationSent };
