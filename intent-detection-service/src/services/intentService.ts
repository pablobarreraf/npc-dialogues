import axios from "axios";
import dotenv from "dotenv";
import {
  callHuggingFaceAPI,
  ClassificationResponse,
} from "../utils/huggingface";

dotenv.config();

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";

const candidateLabels = ["lore", "bargaining", "general", "crafting"];

interface IntentResponse {
  success: boolean;
  intent?: string;
  message?: string;
}

export async function getIntent(input: string): Promise<IntentResponse> {
  try {
    console.log("getIntent:", input);

    // Set up headers
    if (!HUGGINGFACE_API_KEY) {
      throw new Error("Hugging Face API key is missing.");
    }

    const response = await callHuggingFaceAPI(MODEL_URL, HUGGINGFACE_API_KEY, {
      inputs: input,
      parameters: {
        candidate_labels: candidateLabels,
      },
    });

    console.log("response:", response);

    // Success case
    const result = response.data as ClassificationResponse;
    const maxScoreIndex = result.scores.indexOf(Math.max(...result.scores));
    return {
      success: true,
      intent: result.labels[maxScoreIndex]
    };

  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 503) {
      return {
        success: false,
        message: "Model loading, try again later"
      };
    }
    
    // Handle other errors
    console.error('Unexpected error:', error);
    throw error;
  }
}
