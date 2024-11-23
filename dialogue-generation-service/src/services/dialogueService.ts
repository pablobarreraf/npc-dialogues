import { dialogueTemplates } from "../utils/templates";

// Add type for valid intents
type DialogueIntent = 'lore' | 'bargaining' | 'general' | 'crafting' | 'unknown';

export function generateDialogue(input: string, intent: DialogueIntent): string {
  return dialogueTemplates[intent]?.(input) || dialogueTemplates.unknown();
}
