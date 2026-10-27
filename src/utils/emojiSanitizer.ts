/**
 * Utility to enforce the strict "NO EMOJIS" rule across the entire application.
 * Strips unicode emojis, emoji modifiers, pictographs, and flags.
 */

// Regex covering emoji ranges, symbols, supplemental pictographs, and dingbats
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu;

/**
 * Removes all emojis from the given string and normalizes extra spaces.
 */
export function stripEmojis(input: string): string {
  if (!input) return '';
  return input.replace(EMOJI_REGEX, '');
}

/**
 * Checks if a string contains any emojis.
 */
export function hasEmojis(input: string): boolean {
  if (!input) return false;
  return EMOJI_REGEX.test(input);
}

/**
 * Formats channel names to clean kebab-case with no emojis.
 */
export function sanitizeChannelName(name: string): string {
  const cleaned = stripEmojis(name)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'channel';
}
