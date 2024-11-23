import { Router, Request, Response } from "express";
import { getIntent } from "../services/intentService";
import { preprocessInput } from "../utils/preprocess";
import { Kafka } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import { waitForKafkaResponse, setKafkaConsumer } from '../utils/kafkaUtils';

const router = Router();
const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "intent-service-group" });

// Connect Kafka producer and consumer
async function startProducer() {
  await producer.connect();
  console.log("Kafka producer connected");
}

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "dialogue-response-topic", fromBeginning: false });
  setKafkaConsumer(consumer); // Set the consumer in utils
  console.log("Kafka consumer connected to dialogue-response-topic");
}

startProducer();
startConsumer();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { input } = req.body;

    if (!input) {
      res.status(400).json({ error: "Input text is required" });
      return;
    }

    // Preprocess input
    const cleanedInput = preprocessInput(input);

    // Detect intent
    const intent = await getIntent(cleanedInput);

    // Generate a unique correlation ID
    const correlationId = uuidv4();

    // Publish the request to Kafka
    const event = {
      input: cleanedInput,
      intent: intent.intent,
      correlationId, // Include the correlation ID
    };

    console.log("Publishing event to Kafka:", event);

    await producer.send({
      topic: "intent-topic",
      messages: [{ value: JSON.stringify(event) }],
    });

    // Wait for the response (pass only the correlationId)
    const response = await waitForKafkaResponse(correlationId);

    // Respond with the dialogue response
    res.status(200).json({
      message: "Response from dialogue service",
      intent: intent.intent,
      dialogue: response,
    });
  } catch (error) {
    console.error("Error in /intent endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports.detectIntent = router;
