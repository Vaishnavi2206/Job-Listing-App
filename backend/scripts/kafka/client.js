const { Kafka, logLevel } = require('kafkajs');

// From the host machine, the broker is reachable on localhost:9094
// (the EXTERNAL listener defined in infra/kafka/docker-compose.yml).
// If this code runs inside a container on the same "kafka-net" network,
// use 'kafka:9092' instead.
const BROKER = process.env.KAFKA_BROKER || 'localhost:9094';

const kafka = new Kafka({
  clientId: 'job-listing-app',
  brokers: [BROKER],
  logLevel: logLevel.NOTHING,
});

module.exports = { kafka };