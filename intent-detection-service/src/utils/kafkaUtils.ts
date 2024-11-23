import { Kafka, Consumer } from "kafkajs";

let sharedConsumer: Consumer | null = null;

export function setKafkaConsumer(consumer: Consumer) {
  sharedConsumer = consumer;
}

export function waitForKafkaResponse(correlationId: string): Promise<any> {
  if (!sharedConsumer) {
    throw new Error("Kafka consumer is not set up");
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Response timed out"));
    }, 5000);

    sharedConsumer!
      .run({
        eachMessage: async ({ message }) => {
          const event = JSON.parse(message.value?.toString() || "{}");

          if (event.correlationId === correlationId) {
            clearTimeout(timeout);
            resolve(event.response);
          }
        },
      })
      .catch(reject);
  });
}
