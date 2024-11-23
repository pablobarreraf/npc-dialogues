import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

export async function initializeRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis client connected.");
  }
}

export async function closeRedisClient() {
  if (redisClient.isOpen) {
    await redisClient.quit();
    console.log("Redis client closed.");
  }
}

export async function getMemory(key: string): Promise<any[]> {
  if (!redisClient.isOpen) {
    await initializeRedisClient();
  }
  const memory = await redisClient.get(key);
  return memory ? JSON.parse(memory) : [];
}

export async function setMemory(key: string, memory: any[]): Promise<void> {
  if (!redisClient.isOpen) {
    await initializeRedisClient();
  }
  await redisClient.set(key, JSON.stringify(memory));
}

export { redisClient };
