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

    let generatedText = response.data[0]?.generated_text || "";
    
    // Clean up the response by removing the prompt and any system-like text
    generatedText = generatedText
      .replace(prompt, '')
      .replace(/User:|Intent:|Response:|As a medieval market merchant,|Previous context:/gi, '')
      .trim();

    return generatedText || "I apologize, but I couldn't generate a proper response.";
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
  const memoryKey = `user:${userId}:memory`;
  const memory = await getMemory(memoryKey) || [];

  // Only use context if the last interactions had the same intent
  const recentContext = memory
    .filter((entry: any) => entry.intent === intent)  // Only keep matching intents
    .slice(-2)  // Get last 2 matching exchanges
    .map((entry: any) => entry.response)
    .join("\n");

  const baseContext = "You are a medieval sword merchant in a fantasy market. You sell various types of swords including longswords, shortswords, broadswords, and rapiers.";
  
  let prompt: string;
  switch (intent) {
    case "general":
      prompt = `${baseContext}\n${recentContext ? `Previous context: ${recentContext}\n\n` : ''}Customer says: ${input}\nRespond as the merchant.`;
      break;
    case "bargaining":
      prompt = `${baseContext}\nPrevious context: ${recentContext}\n\nCustomer asks: ${input}\nRespond as the merchant, discussing prices and being willing to negotiate.`;
      break;
    case "lore":
      prompt = `${baseContext}\nPrevious context: ${recentContext}\n\nCustomer asks: ${input}\nRespond as the merchant, telling me about the history and legends of ${input}.`;
      break;
    case "crafting":
      prompt = `${baseContext}\nPrevious context: ${recentContext}\n\nCustomer asks: ${input}\nRespond as the merchant, explaining the process of creating ${input}.`;
      break;
    default:
      prompt = `${baseContext}\nPrevious context: ${recentContext}\n\nCustomer asks: ${input}\nRespond as the merchant.`;
  }

  const response = await callHuggingFaceAPI(prompt);
  
  // Store the interaction in memory
  const newMemory = [...memory, { input, intent, response }].slice(-5);
  await setMemory(memoryKey, newMemory);

  return response;
}
