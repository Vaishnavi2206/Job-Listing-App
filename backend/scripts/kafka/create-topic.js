const { kafka } = require('./client');

const TOPIC = 'application-status-updated';

async function main() {
  const admin = kafka.admin();
  await admin.connect();

  const existing = await admin.listTopics();
  if (existing.includes(TOPIC)) {
    console.log(`Topic "${TOPIC}" already exists.`);
  } else {
    await admin.createTopics({
      topics: [
        {
          topic: TOPIC,
          numPartitions: 3,
          replicationFactor: 1,
        },
      ],
    });
    console.log(`Topic "${TOPIC}" created.`);
  }

  const metadata = await admin.fetchTopicMetadata({ topics: [TOPIC] });
  console.log(JSON.stringify(metadata, null, 2));

  await admin.disconnect();
}

main().catch((err) => {
  console.error('Failed to create topic:', err);
  process.exit(1);
});