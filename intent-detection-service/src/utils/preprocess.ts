export function preprocessInput(input: string): string {
  // Remove special characters, excessive whitespace, etc.
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "");
}
