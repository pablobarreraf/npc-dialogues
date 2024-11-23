import { getMemory, setMemory } from "../utils/redisClient";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Add type for valid intents
type DialogueIntent =
  | "lore"
  | "bargaining"
  | "general"
  | "crafting"
  | "unknown";

// Hugging Face API URL and model
const HUGGINGFACE_API_URL =
  "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct";

// Load the API key from environment variables
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!HUGGINGFACE_API_KEY) {
  throw new Error("Hugging Face API key is not set. Add it to your .env file.");
}

// Function to call Hugging Face Inference API
async function callHuggingFaceAPI(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        },
      }
    );

    const generatedText =
      response.data[0]?.generated_text || "No response generated.";
    return generatedText.trim();
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    return "An error occurred while generating a response.";
  }
}

// Generate dialogue based on the intent and input
export async function generateDialogue(
  userId: string,
  input: string,
  intent: DialogueIntent
): Promise<string> {
  // Retrieve memory from Redis
  const memoryKey = `user:${userId}:memory`;
  const memory = await getMemory(memoryKey);

  // Build memory context
  const MAX_MEMORY_RECORDS = 5; // Limit the number of memory records

  const memoryContext = memory
    ? memory
        .filter((entry: any) => entry.intent === intent) // Include only relevant intent
        .slice(-MAX_MEMORY_RECORDS) // Take the last MAX_MEMORY_RECORDS entries
        .map(
          (entry: any) =>
            `User: ${entry.input}\nIntent: ${entry.intent}\nResponse: ${entry.response}`
        )
        .join("\n")
    : "";

  // Craft a prompt based on the intent and include memory context
  let prompt: string;
  switch (intent) {
    case "lore":
      prompt = `${memoryContext}\nIn this medieval fantasy world, tell me about the history and legends of ${input}. Respond in the style of a wise scholar.`;
      break;
    case "bargaining":
      prompt = `${memoryContext}\nAs a medieval market merchant, respond to a customer interested in ${input}. Set a price and be willing to negotiate. Keep the tone medieval and merchant-like.`;
      break;
    case "general":
      prompt = `${memoryContext}\nYou are a medieval villager. Answer this question about ${input}. Keep your response friendly and in-character for a medieval fantasy setting.`;
      break;
    case "crafting":
      prompt = `${memoryContext}\nAs a medieval craftsperson, explain the process of creating ${input}. Include materials and methods that would exist in a medieval fantasy world.`;
      break;
    default:
      prompt = `${memoryContext}\nAs a medieval village resident, respond to this question about ${input}. Keep your response within the context of a medieval fantasy world.`;
  }

  // Call the Hugging Face API with the crafted prompt
  const response = await callHuggingFaceAPI(prompt);

  // Update memory in Redis
  const newMemory = memory || [];
  newMemory.push({ input, intent, response });

  // Limit memory to the last 5 exchanges
  if (newMemory.length > 5) {
    newMemory.shift();
  }

  await setMemory(memoryKey, newMemory);

  return response;
}
