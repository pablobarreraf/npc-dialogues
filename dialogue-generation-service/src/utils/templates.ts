export const dialogueTemplates = {
    lore: (input: string) =>
      `The lore of the ${input.trim()} is fascinating! It dates back to ancient times.`,
    bargaining: () => "Let's discuss the price. What's your offer?",
    general: () => "What can I help you with today?",
    crafting: (input: string) =>
      `To craft the ${input.trim()}, you need rare materials.`,
    unknown: () => "I'm not sure how to respond to that. Could you clarify?",
  };
  