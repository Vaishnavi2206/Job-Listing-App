# Kafka (KRaft mode) — local dev setup

No ZooKeeper. Single broker running in KRaft combined mode (broker + controller
in one process) + Kafka UI for topic inspection.

## 1. Start it

```bash
cd infra/kafka
docker compose up -d
```

## 2. Verify broker startup

```bash
docker compose ps
```

Wait until `kafka` shows `(healthy)`. Then check logs if needed:

```bash
docker compose logs -f kafka
```

You should see a line like `Kafka Server started`. You can also verify directly:

```bash
docker exec kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

If that prints the broker's supported API versions instead of erroring, the broker is up.

## 3. Kafka UI

Open http://localhost:8088 — you should see the `local` cluster with 0 topics
(or the ones you've created). This is where you inspect topics, partitions,
messages, and consumer groups visually.

## 4. Create the topic

Either via the CLI:

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic application-status-updated \
  --partitions 3 --replication-factor 1
```

Or via the Node.js script (from `backend/scripts/kafka`):

```bash
node create-topic.js
```

Confirm it exists:

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

## 5. Produce a sample message

```bash
node producer.js
```

## 6. Consume the sample message

```bash
node consumer.js
```

Leave it running — it will print any message published to
`application-status-updated`, including the one from step 5.

## Notes

- From your **host machine** (Node.js scripts, backend app not in Docker),
  connect using `localhost:9094` (the `EXTERNAL` listener).
- From **inside the Docker network** (other containers, e.g. if you later
  containerize the backend), connect using `kafka:9092`.
- Data persists in the `kafka-data` named volume across restarts. To fully
  reset: `docker compose down -v`.