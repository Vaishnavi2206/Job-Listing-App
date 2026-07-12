# Async Email Notifications (BullMQ + Redis)

This document explains how and why this project sends candidate emails
(application approved / rejected) **asynchronously**, using Redis and
BullMQ, instead of sending them directly inside the API request. It's
written for anyone new to async processing, Redis, or BullMQ — no prior
experience assumed.

---

## 1. The problem this solves

Without this system, an update endpoint might look like:

```js
app.patch('/applications/:id/status', async (req, res) => {
  await updateStatusInDb(req.params.id, req.body.status);
  await sendEmail(candidate.email, subject, body); // blocks the request
  res.json({ ok: true });
});
```

The `await sendEmail(...)` line means the API **pauses and waits** until
the email is fully sent to an external mail server before it can respond.
That's a problem because:

- Sending mail over the network can take anywhere from ~200ms to several
  seconds, sometimes longer if the mail server is slow.
- The user (e.g. a recruiter clicking "Approve") sits waiting on
  something they can't even see happening.
- If the mail server is briefly down, the **entire request fails**, even
  though the actual important part (updating the DB) succeeded fine.

## 2. The fix: don't send inside the request — queue it, send it separately

Instead, the API just writes down *"an email needs to be sent"* somewhere
durable, and responds immediately. Something else, running as a totally
separate process, picks that note up and sends the email whenever it can.

- The thing that **writes the note** is called the **producer** (our API).
- The thing that **reads the note and does the work** is called the
  **consumer**, or in BullMQ's terms, the **worker**.
- Each note is called a **job**.

This pattern is called **async / background job processing**, and it's
one of the most common patterns in real backend systems for anything
that's slow, unreliable, or doesn't need to block the user's response
(emails, PDF generation, image processing, webhooks, etc).

## 3. What is Redis, here?

Redis is a very fast, simple, in-memory database. In this project it is
**not** used to store candidates, applications, or any of our real
business data (that's what Postgres is for) — it's used purely to hold
the queue of pending jobs.

Why not just use a JavaScript array in memory instead? Because if the API
process restarts (crash, redeploy), an in-memory array is wiped and every
pending job is lost. Redis lives in its own process, so it survives the
API restarting, and lets multiple separate processes (the API, and one or
more workers) safely share the same queue.

## 4. What is BullMQ?

BullMQ is a library that implements a reliable job queue on top of Redis,
so we don't have to build one ourselves. Correctly handling retries,
making sure two workers never process the same job twice, cleaning up old
jobs, etc. is genuinely hard to get right from scratch — BullMQ has
already solved it.

It gives us two main pieces:

- **`Queue`** — used by the API to add jobs.
- **`Worker`** — a separate process that watches the queue and processes
  jobs as they arrive.

## 5. Step-by-step: what actually happens when a status changes

1. A recruiter approves or rejects a candidate's application in the frontend.
2. The backend controller updates the application's status in Postgres — unchanged from before.
3. The controller calls `enqueueStatusEmail({ applicationId, status, recipientEmail, applicantName })`.
4. That function calls `queue.add(...)`, which writes a small JSON payload into Redis. This takes ~1-2ms — it is **not** sending the email, just recording that one needs to be sent.
5. The controller responds to the frontend immediately. The email has not been sent yet, and that's fine — nothing is waiting on it.
6. Separately, the **worker process** (started with `npm run start:worker`, running in its own terminal/container) is continuously watching Redis. The instant a new job appears, it picks it up.
7. The worker runs the email-sending logic and actually talks to the SMTP provider.
8. On success, the job is marked `completed`.
9. On failure (SMTP timeout, provider error), BullMQ automatically retries the job a few times with increasing delay between attempts, instead of losing it.

## 6. Why the API and the worker must run as two separate processes

The API (however you normally start it, e.g. `npm run dev`) and the
worker (`npm run start:worker`) are **two different running processes**,
both connected to the same Redis instance.

This matters because:

- **If the worker isn't running, no emails will ever send.** Jobs will
  just sit in Redis, queued but never processed. This is the first thing
  to check if emails don't seem to be going out.
- They fail and restart independently — if the worker crashes or SMTP is
  down, the API keeps responding normally to everything else.
- You can run more worker processes later if email volume grows, with no
  changes to the API at all.

## 7. Key terms you'll see in the code

| Term | Meaning |
|---|---|
| `jobId` | A unique name for a job, built from `applicationId + status`. If the exact same job is added twice (double click, retried request), BullMQ silently ignores the duplicate — this is what prevents sending the same email twice. |
| `concurrency` | How many jobs a single worker process handles in parallel. |
| `attempts` | How many times BullMQ will retry a failed job before giving up. |
| `backoff` | How long BullMQ waits between retry attempts (grows longer each time). |
| `meta` | An optional, open object for any extra data the email template needs. Not required — omit it if there's nothing extra to pass. |

## 8. Running it locally

Redis runs in Docker; the backend and worker run natively on your machine
so they can use your existing local Postgres data.

**1. Start Redis:**
```bash
docker run -d -p 6379:6379 --name redis --restart unless-stopped redis:7-alpine
```

**2. Confirm it's up:**
```bash
docker exec -it redis redis-cli ping
# should reply: PONG
```

**3. In your backend's `.env`, point at local Redis:**
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**4. Run backend and worker in separate terminals:**
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run start:worker
```

**5. (Optional) Run the dashboard to visually inspect jobs:**
```bash
npm run dashboard
# open http://localhost:3001/admin/queues
```

**6. Test end-to-end:** approve/reject an application from the frontend,
then watch Terminal 2 — you should see the worker log picking up and
completing the job within moments.

## 9. Adding a new field to the email

The `meta` object is where any extra, template-specific data goes. For
example, to include the job title in the email:

```js
await enqueueStatusEmail({
  applicationId,
  status,
  recipientEmail: application.candidateId.email,
  applicantName: `${application.candidateId.firstName} ${application.candidateId.lastName}`,
  meta: { jobTitle: application.jobId.title },
});
```

Then reference `meta.jobTitle` inside the template in the email service.
`meta` is optional — if there's nothing extra to send, omit it entirely
or pass `{}`.
