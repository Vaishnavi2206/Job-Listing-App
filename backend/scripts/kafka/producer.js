const { kafka } = require('./client');

const TOPIC = 'application-status-updated';

async function main() {
  const producer = kafka.producer();
  await producer.connect();

  const sampleEvent = {
    applicationId: 'app_12345',
    jobId: 'job_98765',
    candidateId: 'user_555',
    previousStatus: 'SUBMITTED',
    newStatus: 'UNDER_REVIEW',
    updatedAt: new Date().toISOString(),
  };

  await producer.send({
    topic: TOPIC,
    messages: [
      {
        key: sampleEvent.applicationId,
        value: JSON.stringify(sampleEvent),
      },
    ],
  });

  console.log('Sent sample message:', sampleEvent);

  await producer.disconnect();
}

main().catch((err) => {
  console.error('Failed to produce message:', err);
  process.exit(1);
});