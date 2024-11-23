import { Consumer } from "kafkajs";

let sharedConsumer: Consumer | null = null;
const pendingResponses = new Map<string, (response: any) => void>();

export function setKafkaConsumer(consumer: Consumer) {
  sharedConsumer = consumer;

  // Start listening for messages once the consumer is set
  sharedConsumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value?.toString() || "{}");
      const { correlationId, response } = event;

      // Resolve the promise if there's a matching correlationId
      if (pendingResponses.has(correlationId)) {
        pendingResponses.get(correlationId)?.(response);
        pendingResponses.delete(correlationId);
      }
    },
  });
}

export function waitForKafkaResponse(correlationId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingResponses.delete(correlationId); // Cleanup on timeout
      reject(new Error("Response timed out"));
    }, 5000);

    // Store the resolve function mapped to the correlationId
    pendingResponses.set(correlationId, (response) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}
