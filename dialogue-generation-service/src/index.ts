import { Kafka } from "kafkajs";
import { generateDialogue } from "./services/dialogueService";
import { initializeRedisClient, closeRedisClient } from "./utils/redisClient";

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "dialogue-service-group" });
const producer = kafka.producer();

async function startDialogueService() {
  try {
    // Initialize Redis
    await initializeRedisClient();

    // Connect Kafka producer and consumer
    await consumer.connect();
    await producer.connect();

    // Subscribe to the intent-topic
    await consumer.subscribe({ topic: "intent-topic", fromBeginning: false });

    console.log("Listening to Kafka topic: intent-topic");

    await consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value?.toString() || "{}");
        const { input, intent, correlationId } = event;

        console.log("Received event from Kafka:", event);

        // Generate response with memory
        const userId = "single_user"; // Static user ID for single-user app
        const response = await generateDialogue(userId, input, intent);

        console.log("Generated Response:", response);

        // Publish response to dialogue-response-topic
        const responseEvent = {
          correlationId, // Include the same correlationId for tracking
          response,
        };

        console.log("Publishing response to Kafka:", responseEvent);

        await producer.send({
          topic: "dialogue-response-topic",
          messages: [{ value: JSON.stringify(responseEvent) }],
        });
      },
    });
  } catch (error) {
    console.error("Failed to start dialogue service:", error);
    process.exit(1);
  }
}

// Gracefully close Redis on exit
process.on("SIGINT", async () => {
  await closeRedisClient();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeRedisClient();
  process.exit(0);
});

startDialogueService();
