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

    // Extract the generated text and remove the prompt from the response
    const generatedText = response.data[0]?.generated_text;
    if (!generatedText) {
      console.error("No generated_text found in the API response.");
      return "I couldn't come up with a response.";
    }

    // Clean up the response by removing the prompt
    const cleanedResponse = generatedText.replace(prompt, '').trim();
    return cleanedResponse;
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    return "Something went wrong while generating a response.";
  }
}

// Generate dialogue based on the intent and input
export async function generateDialogue(
  input: string,
  intent: DialogueIntent
): Promise<string> {
  let prompt: string;

  // Craft a prompt based on the intent
  switch (intent) {
    case "lore":
      prompt = `In this medieval fantasy world, tell me about the history and legends of ${input}. Respond in the style of a wise scholar.`;
      break;
    case "bargaining":
      prompt = `As a medieval market merchant, respond to a customer interested in ${input}. Set a price and be willing to negotiate. Keep the tone medieval and merchant-like.`;
      break;
    case "general":
      prompt = `You are a medieval villager. Answer this question about ${input}. Keep your response friendly and in-character for a medieval fantasy setting.`;
      break;
    case "crafting":
      prompt = `As a medieval craftsperson, explain the process of creating ${input}. Include materials and methods that would exist in a medieval fantasy world.`;
      break;
    default:
      prompt = `As a medieval village resident, respond to this question about ${input}. Keep your response within the context of a medieval fantasy world.`;
  }

  // Call the Hugging Face API with the crafted prompt
  return await callHuggingFaceAPI(prompt);
}
