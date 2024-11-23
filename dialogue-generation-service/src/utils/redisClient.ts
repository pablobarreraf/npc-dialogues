import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Connected to Redis");
  }
}

export async function setMemory(key: string, value: any, ttl: number = 300) {
  await redisClient.set(key, JSON.stringify(value), { EX: ttl });
}

export async function getMemory(key: string): Promise<any> {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

export async function deleteMemory(key: string) {
  await redisClient.del(key);
}

export default redisClient;
