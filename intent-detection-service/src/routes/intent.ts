import { Router, Request, Response } from "express";
import { getIntent } from "../services/intentService";
import { preprocessInput } from "../utils/preprocess";
import { Kafka } from "kafkajs";

const router = Router();
const kafka = new Kafka({ brokers: ["localhost:9092"] });
const producer = kafka.producer();

// Connect Kafka producer
async function startProducer() {
  await producer.connect();
  console.log("Kafka producer connected");
}
startProducer();

// POST /intent
router.post("/", async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    console.log("Request body:", req.body);

    if (!input) {
      res.status(400).json({ error: "Input text is required" });
      return;
    }

    // Preprocess the input
    const cleanedInput = preprocessInput(input);

    // Detect intent
    const intent = await getIntent(cleanedInput);

    // Publish to Kafka
    const event = {
      input: cleanedInput,
      intent: intent.intent, // Only include the intent value
    };

    console.log("Publishing event to Kafka:", event);

    await producer.send({
      topic: "intent-topic", // Topic to publish to
      messages: [{ value: JSON.stringify(event) }],
    });

    // Respond to the caller
    res.status(200).json({
      message: "Intent detected and sent to dialogue service",
      intent: intent.intent,
    });
  } catch (error) {
    console.error("Error detecting intent:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports.detectIntent = router;
