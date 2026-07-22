const { kafka } = require('./client');

const TOPIC = 'application-status-updated';
const GROUP_ID = 'application-status-updated-logger';

async function main() {
  const consumer = kafka.consumer({ groupId: GROUP_ID });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });

  console.log(`Listening on "${TOPIC}" (group: ${GROUP_ID})... Ctrl+C to stop.`);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value ? message.value.toString() : null;
      console.log(`\n[${topic}] partition=${partition} offset=${message.offset}`);
      console.log('key:', message.key ? message.key.toString() : null);
      try {
        console.log('value:', JSON.parse(value));
      } catch {
        console.log('value:', value);
      }
    },
  });
}

main().catch((err) => {
  console.error('Failed to consume messages:', err);
  process.exit(1);
});