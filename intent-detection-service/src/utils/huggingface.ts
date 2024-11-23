import axios from 'axios';

interface ClassificationParams {
  inputs: string;
  parameters: {
    candidate_labels: string[];
  };
}

export interface ClassificationResponse {
  sequence: string;
  labels: string[];
  scores: number[];
}

export async function callHuggingFaceAPI(
  modelUrl: string, 
  apiKey: string, 
  payload: ClassificationParams
) {
  return axios.post(modelUrl, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
} 