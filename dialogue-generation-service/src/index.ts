import { Kafka } from "kafkajs";
import { generateDialogue } from "./services/dialogueService";

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "dialogue-service-group" });
const producer = kafka.producer();

async function startDialogueService() {
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

      // Generate response
      const response = generateDialogue(input, intent);

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
}

startDialogueService().catch((error) => {
  console.error("Failed to start dialogue service:", error);
});