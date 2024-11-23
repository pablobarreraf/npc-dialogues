import axios from "axios";

// Add type for valid intents
type DialogueIntent = 'lore' | 'bargaining' | 'general' | 'crafting' | 'unknown';

// Hugging Face API URL and model
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";

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
    // Extract the generated text from the response
    return response.data.generated_text || "I couldn't come up with a response.";
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    return "Something went wrong while generating a response.";
  }
}

// Generate dialogue based on the intent and input
export async function generateDialogue(input: string, intent: DialogueIntent): Promise<string> {
  let prompt: string;

  // Craft a prompt based on the intent
  switch (intent) {
    case "lore":
      prompt = `Tell me the lore about: ${input}`;
      break;
    case "bargaining":
      prompt = `Act as a merchant. Negotiate the price of: ${input}`;
      break;
    case "general":
      prompt = `You are a helpful assistant. Respond to: ${input}`;
      break;
    case "crafting":
      prompt = `Explain how to craft: ${input}`;
      break;
    default:
      prompt = `I don't understand. Please clarify: ${input}`;
  }

  // Call the Hugging Face API with the crafted prompt
  return await callHuggingFaceAPI(prompt);
}
